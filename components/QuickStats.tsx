import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePrayers } from '../context/PrayerContext';
import { colors, radius, shadow, spacing } from '../constants/theme';

export default function QuickStats() {
  const { prayers } = usePrayers();
  const today = new Date().toISOString().split('T')[0];

  const total = prayers.length;
  const dueToday = prayers.filter((p) => p.status === 'active' && p.date === today).length;
  const answered = prayers.filter((p) => p.status === 'answered').length;

  return (
    <View style={styles.container}>
      <Stat value={total} label="Total" />
      <View style={styles.divider} />
      <Stat value={dueToday} label="Due Today" />
      <View style={styles.divider} />
      <Stat value={answered} label="Answered" />
    </View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.soft,
  },
  statBox: { flex: 1, alignItems: 'center' },
  divider: { width: 1, backgroundColor: colors.border },
  value: { fontSize: 24, fontWeight: '800', color: colors.primary },
  label: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
});
