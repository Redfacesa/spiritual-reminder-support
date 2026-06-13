import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Prayer, PrayerStatus } from '../context/PrayerContext';
import { FAITH_TRADITIONS } from '../constants/faithData';
import { colors, radius, shadow, spacing } from '../constants/theme';

interface PrayerCardProps {
  prayer: Prayer;
  onSetStatus: (status: PrayerStatus) => void;
  onDelete: () => void;
  onGuidance?: () => void;
}

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export default function PrayerCard({ prayer, onSetStatus, onDelete, onGuidance }: PrayerCardProps) {
  const faith = FAITH_TRADITIONS.find((f) => f.id === prayer.faith);
  const accent = faith?.color || colors.accent;
  const isActive = prayer.status === 'active';

  return (
    <View style={[styles.card, { borderLeftColor: accent }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.topic}>{prayer.topic}</Text>
          <Text style={styles.faith}>{faith?.name}</Text>
        </View>
        <StatusBadge status={prayer.status} />
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="alarm-outline" size={14} color={colors.textMuted} />
          <Text style={styles.metaText}>
            {prayer.reminderTime}
            {prayer.recurring ? ' Daily' : ''}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
          <Text style={styles.metaText}>Created {fmtDate(prayer.createdAt)}</Text>
        </View>
      </View>

      {onGuidance && (
        <TouchableOpacity onPress={onGuidance} style={[styles.guidanceButton, { backgroundColor: accent + '15' }]}>
          <Ionicons name="sparkles" size={15} color={accent} />
          <Text style={[styles.guidanceText, { color: accent }]}>Get AI Guidance</Text>
        </TouchableOpacity>
      )}

      <View style={styles.actions}>
        {isActive ? (
          <>
            <TouchableOpacity onPress={() => onSetStatus('completed')} style={[styles.btn, styles.primaryBtn]}>
              <Ionicons name="checkmark" size={15} color="#fff" />
              <Text style={styles.primaryBtnText}>Complete</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onSetStatus('answered')} style={[styles.btn, styles.answeredBtn]}>
              <Ionicons name="sparkles-outline" size={15} color={colors.gold} />
              <Text style={[styles.ghostBtnText, { color: colors.gold }]}>Answered</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity onPress={() => onSetStatus('active')} style={[styles.btn, styles.reactivateBtn]}>
            <Ionicons name="refresh" size={15} color={colors.primary} />
            <Text style={[styles.ghostBtnText, { color: colors.primary }]}>Reactivate</Text>
          </TouchableOpacity>
        )}

        {prayer.status !== 'archived' && isActive && (
          <TouchableOpacity onPress={() => onSetStatus('archived')} style={styles.iconBtn}>
            <Ionicons name="archive-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onDelete} style={styles.iconBtn}>
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StatusBadge({ status }: { status: PrayerStatus }) {
  const map: Record<PrayerStatus, { label: string; bg: string; fg: string }> = {
    active: { label: 'Active', bg: colors.primaryLight, fg: colors.primary },
    completed: { label: 'Completed', bg: colors.successSoft, fg: colors.success },
    answered: { label: 'Answered', bg: colors.goldSoft, fg: colors.gold },
    archived: { label: 'Archived', bg: '#EEF0F5', fg: colors.textMuted },
  };
  const s = map[status];
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.fg }]}>{s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    ...shadow.soft,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  topic: { fontSize: 16, fontWeight: '700', color: colors.text },
  faith: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { fontSize: 11, fontWeight: '700' },
  metaRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: colors.textMuted },
  guidanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  guidanceText: { fontSize: 13, fontWeight: '700' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
  },
  primaryBtn: { flex: 1, backgroundColor: colors.primary },
  primaryBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  answeredBtn: { flex: 1, backgroundColor: colors.goldSoft },
  reactivateBtn: { flex: 1, backgroundColor: colors.primaryLight },
  ghostBtnText: { fontSize: 13, fontWeight: '700' },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
