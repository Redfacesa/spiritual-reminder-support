import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { streamChatReply, transcribeAudio } from '../utils/grok';
import { fetchSermons, insertSermon, deleteSermon, SermonRecord } from '../lib/repositories';
import { getJSON, setJSON } from '../lib/storage';
import { colors, radius, shadow, spacing } from '../constants/theme';

const LOCAL_KEY = 'support.sermons.v1';

function filenameForUri(uri: string) {
  return uri.split('/').pop() || 'sermon-audio.m4a';
}

function mimeTypeForUri(uri: string) {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.webm')) return 'audio/webm';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.caf')) return 'audio/x-caf';
  return 'audio/m4a';
}

export default function SermonsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId } = useAuth();
  const { isPro, faith } = useUser();
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  const [sermons, setSermons] = useState<SermonRecord[]>([]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [audioUri, setAudioUri] = useState('');
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [summarizing, setSummarizing] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = userId ? await fetchSermons() : await getJSON<SermonRecord[]>(LOCAL_KEY, []);
      if (!cancelled) setSermons(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const persistLocal = async (next: SermonRecord[]) => {
    setSermons(next);
    if (!userId) await setJSON(LOCAL_KEY, next);
  };

  const startRecording = async () => {
    if (recorderState.isRecording) return;
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Microphone blocked', 'Enable microphone access to record sermon audio.');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setAudioUri('');
      setTranscript('');
    } catch {
      Alert.alert('Recording failed', 'Could not start recording on this device.');
    }
  };

  const stopRecording = async () => {
    if (!recorderState.isRecording) return;
    try {
      await audioRecorder.stop();
      if (audioRecorder.uri) setAudioUri(audioRecorder.uri);
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    } catch {
      Alert.alert('Recording failed', 'Could not save the recording.');
    }
  };

  const transcribeRecording = async () => {
    if (!audioUri || transcribing || !isPro) return;
    setTranscribing(true);
    try {
      const text = await transcribeAudio({
        uri: audioUri,
        filename: filenameForUri(audioUri),
        mimeType: mimeTypeForUri(audioUri),
      });
      if (text.trim()) setTranscript(text.trim());
      else Alert.alert('No speech detected', 'The transcription service did not return any text.');
    } catch {
      Alert.alert('Transcription failed', 'Could not transcribe the recording. Make sure the proxy server is running.');
    } finally {
      setTranscribing(false);
    }
  };

  const generateSummary = async () => {
    const source = [notes.trim(), transcript.trim()].filter(Boolean).join('\n\nTranscript:\n');
    if (!source || summarizing) return;
    setSummarizing(true);
    setSummary('');
    try {
      const text = await streamChatReply({
        faith,
        messages: [
          {
            role: 'user',
            content:
              'Summarize these sermon/teaching notes or transcript into 3-5 concise bullet points capturing the key message, supporting scripture, and one practical application. Use "- " for bullets.\n\nContent:\n' +
              source,
          },
        ],
        onToken: (full) => setSummary(full),
      });
      if (text) setSummary(text);
    } catch {
      Alert.alert('Summary failed', 'Could not reach the AI service. Make sure the proxy server is running.');
    } finally {
      setSummarizing(false);
    }
  };

  const save = async () => {
    if (!title.trim() && !notes.trim() && !transcript.trim() && !audioUri) return;
    setSaving(true);
    try {
      const payload = {
        title: title.trim() || 'Untitled sermon',
        notes: notes.trim(),
        transcript: transcript.trim(),
        summary: summary.trim(),
        audio_url: audioUri,
      };
      if (userId) {
        const saved = await insertSermon(userId, payload);
        if (saved) await persistLocal([saved, ...sermons]);
      } else {
        const local: SermonRecord = {
          id: Date.now().toString(),
          ...payload,
          created_at: new Date().toISOString(),
        };
        await persistLocal([local, ...sermons]);
      }
      setTitle('');
      setNotes('');
      setAudioUri('');
      setTranscript('');
      setSummary('');
    } finally {
      setSaving(false);
    }
  };

  const remove = (id: string) => {
    Alert.alert('Delete sermon', 'Remove this sermon note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (userId) await deleteSermon(id);
          await persistLocal(sermons.filter((s) => s.id !== id));
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backRow} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Sermon Notes</Text>
        <Text style={styles.subtitle}>Capture teachings and let AI summarize them</Text>
      </View>

      {!isPro && (
        <View style={styles.proBanner}>
          <Ionicons name="star" size={15} color={colors.gold} />
          <Text style={styles.proText}>AI summaries are a Pro feature. You can still save notes for free.</Text>
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
          <View style={styles.recorderCard}>
            <View style={styles.recorderHeader}>
              <View style={[styles.recorderIcon, { backgroundColor: recorderState.isRecording ? colors.dangerSoft : colors.primaryLight }]}>
                <Ionicons name={recorderState.isRecording ? 'radio-button-on' : 'mic'} size={20} color={recorderState.isRecording ? colors.danger : colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.recorderTitle}>{recorderState.isRecording ? 'Recording sermon...' : audioUri ? 'Recording saved' : 'Record sermon audio'}</Text>
                <Text style={styles.recorderSub}>
                  {audioUri ? filenameForUri(audioUri) : 'Tap record, then transcribe with xAI speech-to-text.'}
                </Text>
              </View>
            </View>
            <View style={styles.recorderActions}>
              <TouchableOpacity
                style={[styles.recordBtn, recorderState.isRecording && styles.stopBtn]}
                onPress={recorderState.isRecording ? stopRecording : startRecording}
              >
                <Ionicons name={recorderState.isRecording ? 'stop' : 'mic'} size={16} color="#fff" />
                <Text style={styles.recordBtnText}>{recorderState.isRecording ? 'Stop' : 'Record'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.transcribeBtn, (!audioUri || transcribing || !isPro) && styles.btnDisabled]}
                onPress={transcribeRecording}
                disabled={!audioUri || transcribing || !isPro}
              >
                {transcribing ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons name="document-text" size={16} color={colors.primary} />
                )}
                <Text style={styles.transcribeBtnText}>{isPro ? 'Transcribe' : 'Transcribe (Pro)'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {transcript ? (
            <View style={styles.transcriptBox}>
              <Text style={styles.summaryLabel}>Transcript</Text>
              <Text style={styles.transcriptText}>{transcript}</Text>
            </View>
          ) : null}

          <TextInput
            style={styles.titleInput}
            placeholder="Sermon title"
            placeholderTextColor={colors.textFaint}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={styles.notesInput}
            placeholder="Type or paste your sermon notes here..."
            placeholderTextColor={colors.textFaint}
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
          />

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.aiBtn, ((!notes.trim() && !transcript.trim()) || summarizing || !isPro) && styles.btnDisabled]}
              onPress={generateSummary}
              disabled={(!notes.trim() && !transcript.trim()) || summarizing || !isPro}
            >
              {summarizing ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="sparkles" size={16} color={colors.primary} />
              )}
              <Text style={styles.aiBtnText}>{isPro ? 'AI Summary' : 'AI Summary (Pro)'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, (saving || (!title.trim() && !notes.trim() && !transcript.trim() && !audioUri)) && styles.btnDisabled]}
              onPress={save}
              disabled={saving || (!title.trim() && !notes.trim() && !transcript.trim() && !audioUri)}
            >
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="save" size={16} color="#fff" />}
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>

          {summary ? (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>AI Summary</Text>
              <Text style={styles.summaryText}>{summary}</Text>
            </View>
          ) : null}

          {sermons.length > 0 && <Text style={styles.listLabel}>Saved Sermons</Text>}
          {sermons.map((s) => (
            <View key={s.id} style={styles.sermonCard}>
              <View style={styles.sermonHeader}>
                <Text style={styles.sermonTitle}>{s.title}</Text>
                <TouchableOpacity onPress={() => remove(s.id)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
              <Text style={styles.sermonDate}>{new Date(s.created_at).toLocaleDateString()}</Text>
              {s.audio_url ? (
                <View style={styles.audioMeta}>
                  <Ionicons name="mic" size={13} color={colors.primary} />
                  <Text style={styles.audioMetaText}>Audio attached</Text>
                </View>
              ) : null}
              {s.summary ? <Text style={styles.sermonSummary}>{s.summary}</Text> : null}
              {s.transcript ? <Text style={styles.sermonTranscript} numberOfLines={3}>{s.transcript}</Text> : null}
              {s.notes ? <Text style={styles.sermonNotes} numberOfLines={4}>{s.notes}</Text> : null}
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  backText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 13, color: '#DCDCF7', marginTop: 2 },

  proBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.goldSoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  proText: { flex: 1, color: '#9A7B00', fontSize: 13, fontWeight: '600' },

  recorderCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.soft,
  },
  recorderHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  recorderIcon: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  recorderTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  recorderSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  recorderActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  recordBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  stopBtn: { backgroundColor: colors.danger },
  recordBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  transcribeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primaryLight,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  transcribeBtnText: { color: colors.primary, fontSize: 14, fontWeight: '700' },

  titleInput: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    ...shadow.soft,
  },
  notesInput: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    minHeight: 160,
    marginTop: spacing.md,
    ...shadow.soft,
  },
  actionRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  aiBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primaryLight,
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  aiBtnText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnDisabled: { opacity: 0.5 },

  summaryBox: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    ...shadow.soft,
  },
  summaryLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  summaryText: { fontSize: 15, lineHeight: 23, color: colors.text },
  transcriptBox: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    ...shadow.soft,
  },
  transcriptText: { fontSize: 14, lineHeight: 22, color: colors.textMuted },

  listLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginTop: spacing.xl, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  sermonCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, ...shadow.soft },
  sermonHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sermonTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  sermonDate: { fontSize: 12, color: colors.textFaint, marginTop: 2 },
  audioMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  audioMetaText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  sermonSummary: { fontSize: 14, lineHeight: 21, color: colors.text, marginTop: spacing.sm },
  sermonTranscript: { fontSize: 13, lineHeight: 20, color: colors.textMuted, marginTop: spacing.sm, fontStyle: 'italic' },
  sermonNotes: { fontSize: 13, lineHeight: 20, color: colors.textMuted, marginTop: spacing.sm },
});
