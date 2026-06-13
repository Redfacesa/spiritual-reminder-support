import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, shadow, spacing } from '../constants/theme';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { getJSON, setJSON } from '../lib/storage';
import { READING_PLANS, getReadingPlan } from '../constants/readingPlans';
import { scheduleWeeklyReminder, cancelNotification } from '../utils/notificationHelper';
import SubscriptionModal from '../components/SubscriptionModal';

const WEEK = [
  { key: 'sun', label: 'Sunday', weekday: 1 },
  { key: 'mon', label: 'Monday', weekday: 2 },
  { key: 'tue', label: 'Tuesday', weekday: 3 },
  { key: 'wed', label: 'Wednesday', weekday: 4 },
  { key: 'thu', label: 'Thursday', weekday: 5 },
  { key: 'fri', label: 'Friday', weekday: 6 },
  { key: 'sat', label: 'Saturday', weekday: 7 },
] as const;

interface DayPlan {
  focus: string;
  time: string; // HH:MM
  reminderOn: boolean;
}

interface Goal {
  id: string;
  text: string;
  done: boolean;
}

interface PlannerData {
  intention: string;
  goals: Goal[];
  days: Record<string, DayPlan>;
  readingPlanId?: string;
  notifIds: string[];
}

const emptyData = (): PlannerData => ({
  intention: '',
  goals: [],
  days: WEEK.reduce((acc, d) => {
    acc[d.key] = { focus: '', time: '08:00', reminderOn: false };
    return acc;
  }, {} as Record<string, DayPlan>),
  readingPlanId: undefined,
  notifIds: [],
});

export default function PlannerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPro } = useUser();
  const { userId } = useAuth();

  const storageKey = useMemo(() => `support.planner.v1.${userId ?? 'local'}`, [userId]);

  const [data, setData] = useState<PlannerData>(emptyData());
  const [hydrated, setHydrated] = useState(false);
  const [newGoal, setNewGoal] = useState('');
  const [savingReminders, setSavingReminders] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getJSON<PlannerData>(storageKey, emptyData()).then((saved) => {
      if (cancelled) return;
      // Merge to be resilient to older saved shapes.
      setData({ ...emptyData(), ...saved, days: { ...emptyData().days, ...saved.days } });
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  const persist = (next: PlannerData) => {
    setData(next);
    setJSON(storageKey, next);
  };

  const setIntention = (intention: string) => persist({ ...data, intention });

  const setDay = (key: string, patch: Partial<DayPlan>) =>
    persist({ ...data, days: { ...data.days, [key]: { ...data.days[key], ...patch } } });

  const addGoal = () => {
    const text = newGoal.trim();
    if (!text) return;
    persist({ ...data, goals: [...data.goals, { id: `g-${Date.now()}`, text, done: false }] });
    setNewGoal('');
  };

  const toggleGoal = (id: string) =>
    persist({
      ...data,
      goals: data.goals.map((g) => (g.id === id ? { ...g, done: !g.done } : g)),
    });

  const removeGoal = (id: string) =>
    persist({ ...data, goals: data.goals.filter((g) => g.id !== id) });

  const setReadingPlan = (id: string | undefined) =>
    persist({ ...data, readingPlanId: data.readingPlanId === id ? undefined : id });

  const applyReminders = async () => {
    setSavingReminders(true);
    try {
      // Clear previously scheduled planner reminders first.
      await Promise.all((data.notifIds || []).map((id) => cancelNotification(id)));

      const ids: string[] = [];
      for (const d of WEEK) {
        const plan = data.days[d.key];
        if (plan?.reminderOn && plan.focus.trim()) {
          const id = await scheduleWeeklyReminder({
            topic: `${d.label}: ${plan.focus.trim()}`,
            weekday: d.weekday,
            time: plan.time,
          });
          if (id) ids.push(id);
        }
      }
      persist({ ...data, notifIds: ids });
    } finally {
      setSavingReminders(false);
    }
  };

  const goalsDone = data.goals.filter((g) => g.done).length;
  const daysPlanned = WEEK.filter((d) => data.days[d.key]?.focus.trim()).length;
  const selectedPlan = data.readingPlanId ? getReadingPlan(data.readingPlanId) : undefined;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backRow} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerIcon}>
          <Ionicons name="calendar" size={26} color="#fff" />
        </View>
        <Text style={styles.headerTitle}>Prayer Planner</Text>
        <Text style={styles.headerDesc}>Plan your week of prayer, set goals, and stay on rhythm.</Text>

        {isPro && (
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{daysPlanned}/7</Text>
              <Text style={styles.statLabel}>Days planned</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>
                {goalsDone}/{data.goals.length || 0}
              </Text>
              <Text style={styles.statLabel}>Goals done</Text>
            </View>
          </View>
        )}
      </View>

      {!isPro ? (
        <PlannerLock onUpgrade={() => setShowPaywall(true)} insetsBottom={insets.bottom} />
      ) : !hydrated ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing.xl, paddingBottom: insets.bottom + spacing.xxl }}
          showsVerticalScrollIndicator={false}
        >
          {/* Weekly intention */}
          <Text style={styles.sectionTitle}>This week's intention</Text>
          <TextInput
            style={styles.intentionInput}
            value={data.intention}
            onChangeText={setIntention}
            placeholder="e.g. Pray for patience and a grateful heart"
            placeholderTextColor={colors.textFaint}
            multiline
          />

          {/* Reading plan integration */}
          <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Attach a reading plan</Text>
          <Text style={styles.sectionHint}>Follow a guided plan alongside your week.</Text>
          <View style={styles.planChips}>
            {READING_PLANS.map((p) => {
              const active = data.readingPlanId === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.planChip, active && { backgroundColor: p.accent, borderColor: p.accent }]}
                  onPress={() => setReadingPlan(p.id)}
                >
                  <Ionicons name={p.icon as any} size={15} color={active ? '#fff' : p.accent} />
                  <Text style={[styles.planChipText, active && { color: '#fff' }]}>{p.title}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {selectedPlan && (
            <TouchableOpacity
              style={styles.openPlanBtn}
              onPress={() => router.push({ pathname: '/reading-plan', params: { id: selectedPlan.id } })}
            >
              <Ionicons name="book" size={16} color={colors.primary} />
              <Text style={styles.openPlanText}>Open “{selectedPlan.title}”</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}

          {/* Weekly plan */}
          <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Your week</Text>
          {WEEK.map((d) => {
            const plan = data.days[d.key];
            return (
              <View key={d.key} style={styles.dayCard}>
                <View style={styles.dayTop}>
                  <Text style={styles.dayLabel}>{d.label}</Text>
                  <View style={styles.reminderToggle}>
                    <Ionicons
                      name="notifications-outline"
                      size={16}
                      color={plan.reminderOn ? colors.primary : colors.textFaint}
                    />
                    <Switch
                      value={plan.reminderOn}
                      onValueChange={(v) => setDay(d.key, { reminderOn: v })}
                      trackColor={{ true: colors.primary, false: colors.border }}
                    />
                  </View>
                </View>
                <TextInput
                  style={styles.dayInput}
                  value={plan.focus}
                  onChangeText={(t) => setDay(d.key, { focus: t })}
                  placeholder="Prayer focus for the day"
                  placeholderTextColor={colors.textFaint}
                />
                {plan.reminderOn && (
                  <View style={styles.timeRow}>
                    <Ionicons name="time-outline" size={15} color={colors.textMuted} />
                    <Text style={styles.timeLabel}>Remind at</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={plan.time}
                      onChangeText={(t) => setDay(d.key, { time: t })}
                      placeholder="08:00"
                      placeholderTextColor={colors.textFaint}
                      maxLength={5}
                    />
                  </View>
                )}
              </View>
            );
          })}

          <TouchableOpacity style={styles.applyBtn} onPress={applyReminders} disabled={savingReminders}>
            {savingReminders ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="notifications" size={18} color="#fff" />
                <Text style={styles.applyText}>Save weekly reminders</Text>
              </>
            )}
          </TouchableOpacity>
          {Platform.OS === 'web' && (
            <Text style={styles.webNote}>
              Reminders are delivered on the mobile app. Your plan is saved here on the web.
            </Text>
          )}

          {/* Goals */}
          <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Spiritual goals</Text>
          <View style={styles.addGoalRow}>
            <TextInput
              style={styles.goalInput}
              value={newGoal}
              onChangeText={setNewGoal}
              placeholder="Add a goal, e.g. Read Psalms daily"
              placeholderTextColor={colors.textFaint}
              onSubmitEditing={addGoal}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addGoalBtn} onPress={addGoal}>
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          {data.goals.length === 0 ? (
            <Text style={styles.emptyGoals}>No goals yet. Add one to track your spiritual growth.</Text>
          ) : (
            data.goals.map((g) => (
              <View key={g.id} style={styles.goalRow}>
                <TouchableOpacity style={styles.goalCheck} onPress={() => toggleGoal(g.id)}>
                  <Ionicons
                    name={g.done ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={g.done ? colors.success : colors.textFaint}
                  />
                  <Text style={[styles.goalText, g.done && styles.goalTextDone]}>{g.text}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeGoal(g.id)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color={colors.textFaint} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <SubscriptionModal visible={showPaywall} onClose={() => setShowPaywall(false)} />
    </View>
  );
}

function PlannerLock({ onUpgrade, insetsBottom }: { onUpgrade: () => void; insetsBottom: number }) {
  const perks = [
    { icon: 'calendar', text: 'Plan a prayer focus for every day of the week' },
    { icon: 'flag', text: 'Set spiritual goals and track them' },
    { icon: 'notifications', text: 'Get weekly reminders for each day' },
    { icon: 'book', text: 'Attach guided reading plans to your week' },
  ];
  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: insetsBottom + spacing.xxl }}>
      <View style={styles.lockCard}>
        <View style={styles.lockBadge}>
          <Ionicons name="lock-closed" size={26} color="#fff" />
        </View>
        <Text style={styles.lockTitle}>The Prayer Planner is a Pro feature</Text>
        <Text style={styles.lockSub}>
          Turn good intentions into a steady rhythm. Plan, set goals, and let gentle reminders keep you faithful.
        </Text>
        <View style={styles.perks}>
          {perks.map((p) => (
            <View key={p.text} style={styles.perkRow}>
              <View style={styles.perkIcon}>
                <Ionicons name={p.icon as any} size={16} color={colors.primary} />
              </View>
              <Text style={styles.perkText}>{p.text}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.upgradeBtn} onPress={onUpgrade}>
          <Ionicons name="sparkles" size={18} color="#fff" />
          <Text style={styles.upgradeBtnText}>Upgrade to Pro</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  backText: { color: '#fff', fontSize: 15, fontWeight: '600', marginLeft: 2 },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff' },
  headerDesc: { fontSize: 14, color: '#DCDCF7', marginTop: 4, lineHeight: 20 },
  statRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.lg },
  stat: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  statNum: { fontSize: 18, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: '#DCDCF7', marginTop: 2 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  sectionHint: { fontSize: 13, color: colors.textMuted, marginTop: -4, marginBottom: spacing.md },

  intentionInput: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: 15,
    color: colors.text,
    minHeight: 64,
    textAlignVertical: 'top',
  },

  planChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  planChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  planChipText: { fontSize: 13, fontWeight: '600', color: colors.text },
  openPlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  openPlanText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },

  dayCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.soft,
  },
  dayTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  reminderToggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dayInput: {
    marginTop: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.sm },
  timeLabel: { fontSize: 13, color: colors.textMuted },
  timeInput: {
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    color: colors.text,
    width: 70,
    textAlign: 'center',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    marginTop: spacing.sm,
  },
  applyText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  webNote: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },

  addGoalRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  goalInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  addGoalBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyGoals: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  goalCheck: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  goalText: { fontSize: 14, color: colors.text, flex: 1 },
  goalTextDone: { textDecorationLine: 'line-through', color: colors.textFaint },

  lockCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.soft,
  },
  lockBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  lockTitle: { fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center' },
  lockSub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
  perks: { alignSelf: 'stretch', marginTop: spacing.xl, gap: spacing.md },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  perkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  perkText: { fontSize: 14, color: colors.text, flex: 1 },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignSelf: 'stretch',
    marginTop: spacing.xl,
  },
  upgradeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
