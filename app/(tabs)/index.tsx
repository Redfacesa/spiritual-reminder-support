import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { usePrayers } from '../../context/PrayerContext';
import { useUser } from '../../context/UserContext';
import FaithCard from '../../components/FaithCard';
import CreatePrayerModal from '../../components/CreatePrayerModal';
import GuidanceModal from '../../components/GuidanceModal';
import DailyVerse from '../../components/DailyVerse';
import { FAITH_TRADITIONS } from '../../constants/faithData';
import { colors, radius, shadow, spacing } from '../../constants/theme';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 18) return 'Good Afternoon';
  return 'Good Evening';
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { prayers, addPrayer, streak, activeCount } = usePrayers();
  const { name } = useUser();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFaith, setSelectedFaith] = useState('');
  const [guidanceTarget, setGuidanceTarget] = useState<{ topic: string; faith: string } | null>(null);

  // Next upcoming reminder among active prayers.
  const nextReminder = useMemo(() => {
    const active = prayers.filter((p) => p.status === 'active');
    return active.sort((a, b) => a.reminderTime.localeCompare(b.reminderTime))[0] ?? null;
  }, [prayers]);

  const nextFaith = FAITH_TRADITIONS.find((f) => f.id === nextReminder?.faith);

  const handleFaithSelect = (faithId: string) => {
    setSelectedFaith(faithId);
    setModalVisible(true);
  };

  const handleCreate = (data: any) => {
    addPrayer({
      topic: data.topic,
      faith: data.faith,
      reminderTime: data.reminderTime,
      date: data.date,
      status: 'active',
    });
    setGuidanceTarget({ topic: data.topic, faith: data.faith });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + spacing.md, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome / streak card */}
        <View style={styles.welcomeWrap}>
          <View style={styles.welcomeCard}>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.name}>{name}</Text>
            <View style={styles.statRow}>
              <View style={styles.statPill}>
                <Text style={styles.statEmoji}>🔥</Text>
                <View>
                  <Text style={styles.statValue}>{streak} Days</Text>
                  <Text style={styles.statLabel}>Prayer Streak</Text>
                </View>
              </View>
              <View style={styles.statPill}>
                <Text style={styles.statEmoji}>🙏</Text>
                <View>
                  <Text style={styles.statValue}>{activeCount}</Text>
                  <Text style={styles.statLabel}>Active Prayers</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Next reminder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Prayer</Text>
          {nextReminder ? (
            <View style={[styles.reminderCard, { borderLeftColor: nextFaith?.color || colors.primary }]}>
              <View style={styles.reminderInfo}>
                <Text style={styles.reminderTopic}>{nextReminder.topic}</Text>
                <View style={styles.reminderMetaRow}>
                  <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.reminderMeta}>
                    Today • {nextReminder.reminderTime}
                    {nextReminder.recurring ? ' • Daily' : ''}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.prayNowBtn}
                onPress={() => setGuidanceTarget({ topic: nextReminder.topic, faith: nextReminder.faith })}
              >
                <Text style={styles.prayNowText}>Pray Now</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyReminder}>
              <Text style={styles.emptyReminderText}>No upcoming prayers. Create one below.</Text>
            </View>
          )}
        </View>

        <DailyVerse />

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <QuickAction icon="add-circle" label="New Prayer" tint={colors.primary} onPress={() => setModalVisible(true)} />
            <QuickAction icon="book" label="Read Scripture" tint="#0EA5E9" onPress={() => router.push('/(tabs)/library')} />
            <QuickAction icon="sparkles" label="Ask AI" tint={colors.accent} onPress={() => router.push('/(tabs)/guidance')} />
            <QuickAction icon="heart" label="My Prayers" tint="#EC4899" onPress={() => router.push('/(tabs)/prayers')} />
          </View>
        </View>

        {/* Create prayer faith grid (compact) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Create Prayer Request</Text>
          <Text style={styles.sectionSubtitle}>Choose a tradition to begin</Text>
          <View style={styles.faithGrid}>
            {FAITH_TRADITIONS.map((faith) => (
              <FaithCard
                key={faith.id}
                name={faith.name}
                image={faith.image}
                color={faith.color}
                onPress={() => handleFaithSelect(faith.id)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <CreatePrayerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleCreate}
        initialFaith={selectedFaith}
      />

      <GuidanceModal
        visible={!!guidanceTarget}
        topic={guidanceTarget?.topic || ''}
        faith={guidanceTarget?.faith || 'general'}
        onClose={() => setGuidanceTarget(null)}
      />
    </View>
  );
}

function QuickAction({
  icon,
  label,
  tint,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tint: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.action} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.actionIcon, { backgroundColor: tint + '18' }]}>
        <Ionicons name={icon} size={24} color={tint} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  welcomeWrap: { paddingHorizontal: spacing.xl },
  welcomeCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadow.card,
  },
  greeting: { fontSize: 15, color: '#DCDCF7', fontWeight: '500' },
  name: { fontSize: 28, color: '#fff', fontWeight: '800', marginTop: 2 },
  statRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  statEmoji: { fontSize: 22 },
  statValue: { color: '#fff', fontSize: 16, fontWeight: '800' },
  statLabel: { color: '#DCDCF7', fontSize: 11, fontWeight: '500' },

  section: { paddingHorizontal: spacing.xl, marginTop: spacing.xl },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  sectionSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: -8, marginBottom: spacing.md },

  reminderCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    ...shadow.soft,
  },
  reminderInfo: { flex: 1, paddingRight: 12 },
  reminderTopic: { fontSize: 16, fontWeight: '700', color: colors.text },
  reminderMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  reminderMeta: { fontSize: 13, color: colors.textMuted },
  prayNowBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  prayNowText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  emptyReminder: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadow.soft,
  },
  emptyReminderText: { color: colors.textMuted, fontSize: 14 },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.md },
  action: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadow.soft,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionLabel: { fontSize: 14, fontWeight: '700', color: colors.text },

  faithGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
});
