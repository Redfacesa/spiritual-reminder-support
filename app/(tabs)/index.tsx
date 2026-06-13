import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Linking, Platform } from 'react-native';
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

const APP_STORE_URL = 'https://apps.apple.com/us/app/prayer-reminder/id6755526671';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.prayer.reminder.app';

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
        {Platform.OS === 'web' && <WebHomeHero />}

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

function WebHomeHero() {
  const openLink = (url: string) => Linking.openURL(url);

  return (
    <View style={styles.webHeroWrap}>
      <View style={styles.webHero}>
        <View style={styles.webHeroCopy}>
          <View style={styles.webEyebrow}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
            <Text style={styles.webEyebrowText}>Prayer Reminder Web App</Text>
          </View>
          <Text style={styles.webHeroTitle}>
            Same powerful prayer app, redesigned for the web.
          </Text>
          <Text style={styles.webHeroText}>
            Manage prayers, read sacred texts, follow reading plans, ask the AI guide, and keep your spiritual rhythm from any browser.
          </Text>

          <View style={styles.webHeroActions}>
            <TouchableOpacity style={styles.webPrimaryBtn} onPress={() => openLink(APP_STORE_URL)} activeOpacity={0.85}>
              <Ionicons name="logo-apple" size={20} color="#fff" />
              <View>
                <Text style={styles.webStoreSmall}>Download on the</Text>
                <Text style={styles.webStoreStrong}>App Store</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.webDarkBtn} onPress={() => openLink(PLAY_STORE_URL)} activeOpacity={0.85}>
              <Ionicons name="logo-google-playstore" size={20} color="#fff" />
              <View>
                <Text style={styles.webStoreSmall}>Get it on</Text>
                <Text style={styles.webStoreStrong}>Google Play</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.redFaceRow}>
            <Image source={{ uri: '/welcome/assets/redface-logo.png' }} style={styles.redFaceLogo} />
            <View>
              <Text style={styles.redFaceText}>Built by Red Face (Pty) Ltd</Text>
              <Text style={styles.redFaceLink}>www.redface.in</Text>
            </View>
          </View>
        </View>

        <View style={styles.webHeroMedia}>
          <Image source={{ uri: '/welcome/assets/hero.png' }} style={styles.webHeroImage} resizeMode="cover" />
          <View style={styles.webFloatCard}>
            <Ionicons name="notifications" size={18} color={colors.primary} />
            <Text style={styles.webFloatText}>Mobile downloads ready</Text>
          </View>
        </View>
      </View>
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
  webHeroWrap: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  webHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  webHeroCopy: { flex: 1.05 },
  webEyebrow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  webEyebrowText: { color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  webHeroTitle: { fontSize: 38, lineHeight: 44, fontWeight: '900', color: colors.text, maxWidth: 620 },
  webHeroText: { fontSize: 16, lineHeight: 25, color: colors.textMuted, marginTop: spacing.md, maxWidth: 560 },
  webHeroActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.xl },
  webPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radius.md,
    ...shadow.soft,
  },
  webDarkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#101322',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radius.md,
    ...shadow.soft,
  },
  webStoreSmall: { color: 'rgba(255,255,255,0.78)', fontSize: 10, fontWeight: '600' },
  webStoreStrong: { color: '#fff', fontSize: 15, fontWeight: '800', marginTop: 1 },
  redFaceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: spacing.xl },
  redFaceLogo: { width: 38, height: 38, borderRadius: 8, backgroundColor: '#FBE4E4' },
  redFaceText: { fontSize: 13, fontWeight: '700', color: colors.text },
  redFaceLink: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  webHeroMedia: { flex: 0.95, position: 'relative' },
  webHeroImage: {
    width: '100%',
    height: 330,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  webFloatCard: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...shadow.soft,
  },
  webFloatText: { color: colors.text, fontSize: 13, fontWeight: '800' },
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
