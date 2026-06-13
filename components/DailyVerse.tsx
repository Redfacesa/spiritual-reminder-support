import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SACRED_TEXTS } from '../constants/sacredTexts';
import { useUser } from '../context/UserContext';
import { colors, radius, shadow, spacing } from '../constants/theme';

// Deterministic pick so the "daily" verse is stable within a day.
function pickDaily<T>(items: T[]): T {
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  return items[dayIndex % items.length];
}

export default function DailyVerse() {
  const { faith, isVerseSaved, toggleSavedVerse, dailyVerseEnabled } = useUser();

  const verse = useMemo(() => {
    const pool = SACRED_TEXTS[faith]?.length ? SACRED_TEXTS[faith] : Object.values(SACRED_TEXTS).flat();
    return pickDaily(pool);
  }, [faith]);

  const saved = isVerseSaved(verse.ref);

  if (!dailyVerseEnabled) return null;

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Today's Inspiration</Text>
        <TouchableOpacity onPress={() => toggleSavedVerse({ ...verse, faith })} hitSlop={8}>
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.card}>
        <Ionicons name="sparkles" size={18} color={colors.accent} style={styles.quoteIcon} />
        <Text style={styles.reference}>{verse.ref}</Text>
        <Text style={styles.text}>{verse.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: spacing.xl, marginTop: spacing.sm },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  label: { fontSize: 18, fontWeight: '700', color: colors.text },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    ...shadow.card,
  },
  quoteIcon: { marginBottom: 8 },
  reference: { fontSize: 14, fontWeight: '700', color: colors.primary, marginBottom: 8 },
  text: { fontSize: 16, lineHeight: 24, color: colors.text, fontStyle: 'italic' },
});
