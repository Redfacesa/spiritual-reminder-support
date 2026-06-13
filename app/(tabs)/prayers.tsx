import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { usePrayers, Prayer, PrayerStatus } from '../../context/PrayerContext';
import PrayerCard from '../../components/PrayerCard';
import GuidanceModal from '../../components/GuidanceModal';
import CreatePrayerModal from '../../components/CreatePrayerModal';
import { colors, radius, shadow, spacing } from '../../constants/theme';

const TABS: { key: PrayerStatus; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'answered', label: 'Answered' },
  { key: 'archived', label: 'Archived' },
];

export default function PrayersScreen() {
  const insets = useSafeAreaInsets();
  const { prayers, updatePrayerStatus, deletePrayer, addPrayer } = usePrayers();
  const [tab, setTab] = useState<PrayerStatus>('active');
  const [guidanceTarget, setGuidanceTarget] = useState<Prayer | null>(null);
  const [createVisible, setCreateVisible] = useState(false);

  const counts = useMemo(() => {
    const c: Record<PrayerStatus, number> = { active: 0, completed: 0, answered: 0, archived: 0 };
    prayers.forEach((p) => (c[p.status] += 1));
    return c;
  }, [prayers]);

  const filtered = prayers.filter((p) => p.status === tab);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>My Prayers</Text>
            <Text style={styles.subtitle}>{counts.active} active prayers</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setCreateVisible(true)}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {TABS.map((t) => {
            const selected = t.key === tab;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setTab(t.key)}
                style={[styles.tab, selected && styles.tabSelected]}
              >
                <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{t.label}</Text>
                <View style={[styles.tabCount, selected && styles.tabCountSelected]}>
                  <Text style={[styles.tabCountText, selected && styles.tabCountTextSelected]}>
                    {counts[t.key]}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="flower-outline" size={56} color={colors.textFaint} />
            <Text style={styles.emptyText}>No {tab} prayers</Text>
            <Text style={styles.emptySubtext}>
              {tab === 'active' ? 'Tap + to create your first prayer request.' : `Prayers you mark as ${tab} will appear here.`}
            </Text>
          </View>
        ) : (
          filtered.map((prayer) => (
            <PrayerCard
              key={prayer.id}
              prayer={prayer}
              onSetStatus={(status) => updatePrayerStatus(prayer.id, status)}
              onDelete={() => deletePrayer(prayer.id)}
              onGuidance={() => setGuidanceTarget(prayer)}
            />
          ))
        )}
      </ScrollView>

      <CreatePrayerModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onSubmit={(data) =>
          addPrayer({
            topic: data.topic,
            faith: data.faith,
            reminderTime: data.reminderTime,
            date: data.date,
            status: 'active',
          })
        }
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.soft,
  },
  tabsRow: { gap: spacing.sm, paddingTop: spacing.lg, paddingRight: spacing.xl },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
  },
  tabSelected: { backgroundColor: colors.primary },
  tabText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  tabTextSelected: { color: '#fff' },
  tabCount: {
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: '#E2E4EE',
    alignItems: 'center',
  },
  tabCountSelected: { backgroundColor: 'rgba(255,255,255,0.3)' },
  tabCountText: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  tabCountTextSelected: { color: '#fff' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyText: { fontSize: 18, fontWeight: '700', color: colors.textMuted, marginTop: 16 },
  emptySubtext: { fontSize: 14, color: colors.textFaint, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
});
