import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FAITH_TRADITIONS } from '../constants/faithData';
import { streamChatReply } from '../utils/grok';
import { colors, radius, shadow, spacing } from '../constants/theme';

interface CreatePrayerModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialFaith?: string;
}

const todayISO = () => new Date().toISOString().split('T')[0];

export default function CreatePrayerModal({ visible, onClose, onSubmit, initialFaith }: CreatePrayerModalProps) {
  const [topic, setTopic] = useState('');
  const [faith, setFaith] = useState('');
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [aiPrayer, setAiPrayer] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (visible) {
      setFaith(initialFaith || '');
      setDate(todayISO());
      setAiPrayer('');
    }
  }, [visible, initialFaith]);

  const canSubmit = topic.trim() && faith && time.trim() && date.trim();

  const generatePrayer = async () => {
    if (!topic.trim() || !faith || generating) return;
    setGenerating(true);
    setAiPrayer('');
    try {
      await streamChatReply({
        faith,
        messages: [
          {
            role: 'user',
            content: `Write a short, heartfelt prayer (4-6 sentences) about "${topic.trim()}". Return only the prayer text, no preamble.`,
          },
        ],
        onToken: (full) => setAiPrayer(full),
      });
    } catch {
      setAiPrayer('Could not reach the AI service. Make sure the proxy server is running.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({ topic: topic.trim(), faith, reminderTime: time.trim(), date: date.trim(), status: 'active' });
    setTopic('');
    setFaith('');
    setTime('');
    setDate('');
    setAiPrayer('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>New Prayer Request</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>What are you praying for?</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Business growth, Family health..."
              placeholderTextColor={colors.textFaint}
              value={topic}
              onChangeText={setTopic}
            />

            <Text style={styles.label}>Faith Tradition</Text>
            <View style={styles.faithGrid}>
              {FAITH_TRADITIONS.map((f) => {
                const selected = faith === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => setFaith(f.id)}
                    style={[styles.faithBtn, selected && { backgroundColor: f.color, borderColor: f.color }]}
                  >
                    <Text style={[styles.faithText, selected && { color: '#fff' }]}>{f.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.aiBtn, (!topic.trim() || !faith || generating) && styles.aiBtnDisabled]}
              onPress={generatePrayer}
              disabled={!topic.trim() || !faith || generating}
            >
              {generating ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="sparkles" size={16} color={colors.primary} />
              )}
              <Text style={styles.aiBtnText}>Generate a prayer with AI</Text>
            </TouchableOpacity>

            {aiPrayer ? (
              <View style={styles.aiBox}>
                <Text style={styles.aiBoxLabel}>Your prayer</Text>
                <Text style={styles.aiBoxText}>{aiPrayer}</Text>
              </View>
            ) : null}

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textFaint}
                  value={date}
                  onChangeText={setDate}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Time</Text>
                <TextInput
                  style={styles.input}
                  placeholder="HH:MM"
                  placeholderTextColor={colors.textFaint}
                  value={time}
                  onChangeText={setTime}
                />
              </View>
            </View>

            <TouchableOpacity onPress={handleSubmit} style={[styles.submitBtn, !canSubmit && styles.submitDisabled]} disabled={!canSubmit}>
              <Ionicons name="add-circle" size={18} color="#fff" />
              <Text style={styles.submitText}>Create Prayer</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingTop: spacing.md,
    maxHeight: '88%',
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  label: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: spacing.lg,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.card,
  },
  faithGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
  faithBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  faithText: { fontSize: 13, fontWeight: '600', color: colors.text },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primaryLight,
    paddingVertical: 12,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  aiBtnDisabled: { opacity: 0.5 },
  aiBtnText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  aiBox: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  aiBoxLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: 4 },
  aiBoxText: { fontSize: 14, lineHeight: 21, color: colors.text, fontStyle: 'italic' },
  row: { flexDirection: 'row', gap: spacing.md },
  col: { flex: 1 },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    ...shadow.soft,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
