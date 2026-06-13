import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { FAITH_TRADITIONS } from '../../constants/faithData';
import { SACRED_TEXTS } from '../../constants/sacredTexts';
import { READING_PLANS } from '../../constants/readingPlans';
import { useUser } from '../../context/UserContext';
import { useReadingPlans } from '../../context/ReadingPlanContext';
import { colors, radius, shadow, spacing } from '../../constants/theme';

type Category = 'teachings' | 'saved' | 'plans';

const CATEGORIES: { key: Category; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'teachings', label: 'Sacred Texts', icon: 'book' },
  { key: 'saved', label: 'Saved Verses', icon: 'bookmark' },
  { key: 'plans', label: 'Reading Plans', icon: 'map' },
];

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { savedVerses, isVerseSaved, toggleSavedVerse } = useUser();
  const { completedCount, isStarted } = useReadingPlans();
  const [faithId, setFaithId] = useState<string | null>(null);
  const [category, setCategory] = useState<Category | null>(null);

  const faith = FAITH_TRADITIONS.find((f) => f.id === faithId);

  const goBack = () => {
    if (category) setCategory(null);
    else setFaithId(null);
  };

  // Level 1: faith selection
  if (!faithId) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <Text style={styles.title}>Sacred Library</Text>
          <Text style={styles.subtitle}>Explore teachings across traditions</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl }}>
          {savedVerses.length > 0 && (
            <TouchableOpacity
              style={styles.savedBanner}
              onPress={() => {
                setFaithId('__saved__');
                setCategory('saved');
              }}
            >
              <Ionicons name="bookmark" size={20} color="#fff" />
              <Text style={styles.savedBannerText}>{savedVerses.length} Saved Verses</Text>
              <Ionicons name="chevron-forward" size={18} color="#fff" />
            </TouchableOpacity>
          )}
          {FAITH_TRADITIONS.map((f) => (
            <TouchableOpacity key={f.id} style={styles.faithRow} onPress={() => setFaithId(f.id)} activeOpacity={0.85}>
              <Image source={{ uri: f.image }} style={[styles.faithImg, { backgroundColor: f.color + '22' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.faithName}>{f.name}</Text>
                <Text style={styles.faithCount}>{(SACRED_TEXTS[f.id] || []).length} teachings</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  // Saved-verses shortcut from the banner.
  const isSavedShortcut = faithId === '__saved__';

  // Level 2: category selection
  if (!category && !isSavedShortcut) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <TouchableOpacity onPress={goBack} style={styles.backRow} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
            <Text style={styles.backText}>Library</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{faith?.name}</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity key={c.key} style={styles.categoryRow} onPress={() => setCategory(c.key)} activeOpacity={0.85}>
              <View style={[styles.categoryIcon, { backgroundColor: (faith?.color || colors.primary) + '18' }]}>
                <Ionicons name={c.icon} size={22} color={faith?.color || colors.primary} />
              </View>
              <Text style={styles.categoryLabel}>{c.label}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  // Level 3: content
  const activeCategory: Category = isSavedShortcut ? 'saved' : (category as Category);
  const teachings = SACRED_TEXTS[faithId] || [];
  const savedForFaith = isSavedShortcut ? savedVerses : savedVerses.filter((v) => v.faith === faithId);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={isSavedShortcut ? () => { setFaithId(null); setCategory(null); } : goBack} style={styles.backRow} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
          <Text style={styles.backText}>{isSavedShortcut ? 'Library' : faith?.name}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{CATEGORIES.find((c) => c.key === activeCategory)?.label}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl }}>
        {activeCategory === 'teachings' &&
          teachings.map((t, i) => (
            <VerseCard
              key={i}
              verse={{ ...t, faith: faithId }}
              saved={isVerseSaved(t.ref)}
              onToggle={() => toggleSavedVerse({ ...t, faith: faithId })}
            />
          ))}

        {activeCategory === 'saved' &&
          (savedForFaith.length === 0 ? (
            <EmptyState icon="bookmark-outline" text="No saved verses yet" sub="Tap the bookmark on any verse to save it here." />
          ) : (
            savedForFaith.map((v, i) => (
              <VerseCard key={i} verse={v} saved onToggle={() => toggleSavedVerse(v)} />
            ))
          ))}

        {activeCategory === 'plans' &&
          READING_PLANS.map((p) => {
            const done = completedCount(p.id);
            const started = isStarted(p.id);
            const complete = done >= p.length;
            const pct = Math.round((done / p.length) * 100);
            return (
              <TouchableOpacity
                key={p.id}
                style={styles.planCard}
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/reading-plan', params: { id: p.id } })}
              >
                <View style={styles.planTopRow}>
                  <View style={[styles.planIcon, { backgroundColor: p.accent + '18' }]}>
                    <Ionicons name={p.icon as any} size={20} color={p.accent} />
                  </View>
                  <View style={[styles.planBadge, { backgroundColor: p.accent + '18' }]}>
                    <Text style={[styles.planBadgeText, { color: p.accent }]}>{p.length} days</Text>
                  </View>
                </View>
                <Text style={styles.planTitle}>{p.title}</Text>
                <Text style={styles.planDesc}>{p.desc}</Text>
                <View style={styles.planProgressRow}>
                  <View style={styles.planTrack}>
                    <View style={[styles.planFill, { width: `${pct}%`, backgroundColor: p.accent }]} />
                  </View>
                  <Text style={[styles.planCta, { color: p.accent }]}>
                    {complete ? 'Completed' : started ? `Continue · ${done}/${p.length}` : 'Start plan'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
      </ScrollView>
    </View>
  );
}

function VerseCard({
  verse,
  saved,
  onToggle,
}: {
  verse: { ref: string; text: string; faith: string };
  saved: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.verseCard}>
      <View style={styles.verseHeader}>
        <Text style={styles.verseRef}>{verse.ref}</Text>
        <TouchableOpacity onPress={onToggle} hitSlop={8}>
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <Text style={styles.verseText}>{verse.text}</Text>
    </View>
  );
}

function EmptyState({ icon, text, sub }: { icon: keyof typeof Ionicons.glyphMap; text: string; sub: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={52} color={colors.textFaint} />
      <Text style={styles.emptyText}>{text}</Text>
      <Text style={styles.emptySub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  backText: { fontSize: 15, fontWeight: '600', color: colors.primary },

  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.soft,
  },
  savedBannerText: { flex: 1, color: '#fff', fontWeight: '700', fontSize: 15 },

  faithRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.soft,
  },
  faithImg: { width: 48, height: 48, borderRadius: 24, resizeMode: 'contain' },
  faithName: { fontSize: 16, fontWeight: '700', color: colors.text },
  faithCount: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.soft,
  },
  categoryIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  categoryLabel: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },

  verseCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.soft,
  },
  verseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  verseRef: { fontSize: 14, fontWeight: '700', color: colors.primary },
  verseText: { fontSize: 15, lineHeight: 23, color: colors.text },

  planCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.soft,
  },
  planTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  planIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  planBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill },
  planBadgeText: { fontSize: 11, fontWeight: '700' },
  planTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  planDesc: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  planProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: spacing.md },
  planTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.border },
  planFill: { height: 6, borderRadius: 3 },
  planCta: { fontSize: 12, fontWeight: '700' },

  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyText: { fontSize: 18, fontWeight: '700', color: colors.textMuted, marginTop: 16 },
  emptySub: { fontSize: 14, color: colors.textFaint, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
});
