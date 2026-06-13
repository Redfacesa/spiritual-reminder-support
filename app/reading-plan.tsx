import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getReadingPlan } from '../constants/readingPlans';
import { useReadingPlans } from '../context/ReadingPlanContext';
import { colors, radius, shadow, spacing } from '../constants/theme';

export default function ReadingPlanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const plan = getReadingPlan(String(id));
  const { isDayComplete, completedCount, toggleDay, resetPlan, currentDay } = useReadingPlans();

  const [openDay, setOpenDay] = useState<number | null>(plan ? currentDay(plan.id) : null);

  if (!plan) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + spacing.xl }]}>
        <Text style={styles.title}>Plan not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const done = completedCount(plan.id);
  const pct = Math.round((done / plan.length) * 100);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md, backgroundColor: plan.accent }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backRow} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
          <Text style={styles.backTextLight}>Library</Text>
        </TouchableOpacity>
        <View style={styles.headerIcon}>
          <Ionicons name={plan.icon as any} size={26} color="#fff" />
        </View>
        <Text style={styles.headerTitle}>{plan.title}</Text>
        <Text style={styles.headerDesc}>{plan.desc}</Text>

        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {done}/{plan.length} days
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
        {done === plan.length && (
          <View style={styles.completeBanner}>
            <Ionicons name="trophy" size={20} color={colors.gold} />
            <Text style={styles.completeText}>Plan complete — well done!</Text>
          </View>
        )}

        {plan.days.map((d) => {
          const complete = isDayComplete(plan.id, d.day);
          const open = openDay === d.day;
          return (
            <View key={d.day} style={[styles.dayCard, complete && styles.dayCardDone]}>
              <TouchableOpacity
                style={styles.dayHeader}
                activeOpacity={0.8}
                onPress={() => setOpenDay(open ? null : d.day)}
              >
                <View style={[styles.dayBadge, { backgroundColor: complete ? plan.accent : plan.accent + '22' }]}>
                  {complete ? (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  ) : (
                    <Text style={[styles.dayBadgeText, { color: plan.accent }]}>{d.day}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dayTitle}>{d.title}</Text>
                  <Text style={styles.dayRef}>{d.reference}</Text>
                </View>
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textFaint} />
              </TouchableOpacity>

              {open && (
                <View style={styles.dayBody}>
                  <Text style={styles.verseText}>{d.text}</Text>
                  <View style={styles.reflectBox}>
                    <Text style={styles.reflectLabel}>Reflection</Text>
                    <Text style={styles.reflectText}>{d.reflection}</Text>
                  </View>
                  <View style={styles.promptBox}>
                    <Ionicons name="chatbubble-ellipses-outline" size={15} color={plan.accent} />
                    <Text style={styles.promptText}>{d.prompt}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.markBtn, complete ? styles.markBtnDone : { backgroundColor: plan.accent }]}
                    onPress={() => {
                      toggleDay(plan.id, d.day);
                      if (!complete && d.day < plan.length) setOpenDay(d.day + 1);
                    }}
                  >
                    <Ionicons name={complete ? 'refresh' : 'checkmark-circle'} size={18} color={complete ? plan.accent : '#fff'} />
                    <Text style={[styles.markText, complete && { color: plan.accent }]}>
                      {complete ? 'Mark as not done' : 'Mark day complete'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        {done > 0 && (
          <TouchableOpacity style={styles.resetBtn} onPress={() => resetPlan(plan.id)}>
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
            <Text style={styles.resetText}>Reset progress</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerDesc: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  backText: { fontSize: 15, fontWeight: '600', color: colors.primary },
  backTextLight: { fontSize: 15, fontWeight: '600', color: '#fff' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: spacing.lg },
  progressTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: '#fff' },
  progressText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  completeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.goldSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  completeText: { color: '#9A7B00', fontWeight: '700', fontSize: 14 },

  dayCard: { backgroundColor: colors.card, borderRadius: radius.lg, marginBottom: spacing.md, overflow: 'hidden', ...shadow.soft },
  dayCardDone: { opacity: 0.92 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  dayBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  dayBadgeText: { fontSize: 14, fontWeight: '800' },
  dayTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  dayRef: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  dayBody: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  verseText: { fontSize: 15, lineHeight: 23, color: colors.text, fontStyle: 'italic' },
  reflectBox: { marginTop: spacing.md, backgroundColor: colors.cardAlt, borderRadius: radius.md, padding: spacing.md },
  reflectLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  reflectText: { fontSize: 14, lineHeight: 21, color: colors.text, marginTop: 4 },
  promptBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: spacing.md },
  promptText: { flex: 1, fontSize: 14, color: colors.textMuted, fontStyle: 'italic' },
  markBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radius.md,
    marginTop: spacing.lg,
  },
  markBtnDone: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  markText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, paddingHorizontal: spacing.xl },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: spacing.md, marginTop: spacing.sm },
  resetText: { color: colors.danger, fontWeight: '600', fontSize: 13 },
});
