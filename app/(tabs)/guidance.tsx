import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { FAITH_TRADITIONS } from '../../constants/faithData';
import { streamChatReply, ChatMessage } from '../../utils/grok';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { colors, radius, shadow, spacing } from '../../constants/theme';
import { saveMessage, loadMessages, clearMessages, StoredMessage } from '../../db';
import { clearAiMessages, fetchAiMessages, insertAiMessage } from '../../lib/repositories';

const SUGGESTIONS = [
  'How do I overcome fear?',
  'What does faith mean?',
  'Generate a prayer for my family',
  'Help me practice gratitude today',
];

export default function GuidanceScreen() {
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const { faith: userFaith, isPro, aiMessagesRemaining, registerAiMessage } = useUser();

  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [faith, setFaith] = useState(userFaith || 'general');
  const listRef = useRef<FlatList<StoredMessage>>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (userId) {
        const remote = await fetchAiMessages(userId);
        if (remote.length > 0) {
          if (mounted) setMessages(remote);
          return;
        }
        const local = await loadMessages();
        if (local.length > 0) await Promise.all(local.map((m) => insertAiMessage(userId, m)));
        if (mounted) setMessages(local);
        return;
      }
      const saved = await loadMessages();
      if (mounted) setMessages(saved);
    })();
    return () => {
      mounted = false;
    };
  }, [userId]);

  const scrollToEnd = () => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  const outOfMessages = !isPro && aiMessagesRemaining <= 0;

  const sendText = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    if (outOfMessages) {
      Alert.alert(
        'Daily limit reached',
        'You have used your free AI messages for today. Upgrade to Pro for unlimited guidance.',
      );
      return;
    }

    const userMessage: StoredMessage = {
      id: `u-${Date.now()}`,
      text: trimmed,
      sender: 'user',
      timestamp: new Date(),
      faith,
    };
    const aiId = `a-${Date.now()}`;
    const aiPlaceholder: StoredMessage = {
      id: aiId,
      text: '',
      sender: 'ai',
      timestamp: new Date(),
      faith,
    };

    const history: ChatMessage[] = [...messages, userMessage].map((m) => ({
      role: m.sender === 'ai' ? 'assistant' : 'user',
      content: m.text,
    }));

    setMessages((prev) => [...prev, userMessage, aiPlaceholder]);
    setInput('');
    setLoading(true);
    registerAiMessage();
    scrollToEnd();

    await saveMessage(userMessage);
    if (userId) await insertAiMessage(userId, userMessage);

    try {
      const finalText = await streamChatReply({
        messages: history,
        faith,
        onToken: (fullText) => {
          setMessages((prev) => prev.map((m) => (m.id === aiId ? { ...m, text: fullText } : m)));
          scrollToEnd();
        },
      });

      const resolved = finalText?.trim()
        ? finalText
        : 'I received your message but could not form a response. Please try again.';
      setMessages((prev) => prev.map((m) => (m.id === aiId ? { ...m, text: resolved } : m)));
      await saveMessage({ ...aiPlaceholder, text: resolved });
      if (userId) await insertAiMessage(userId, { ...aiPlaceholder, text: resolved });
    } catch {
      const errText =
        'I am having trouble reaching the guidance service. Please check that the proxy server is running and try again.';
      setMessages((prev) => prev.map((m) => (m.id === aiId ? { ...m, text: errText } : m)));
      await saveMessage({ ...aiPlaceholder, text: errText });
      if (userId) await insertAiMessage(userId, { ...aiPlaceholder, text: errText });
    } finally {
      setLoading(false);
      scrollToEnd();
    }
  };

  const handleClear = () => {
    if (messages.length === 0) return;
    Alert.alert('Clear conversation', 'Remove all messages in this chat?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          setMessages([]);
          await clearMessages();
          if (userId) await clearAiMessages(userId);
        },
      },
    ]);
  };

  const activeFaith = FAITH_TRADITIONS.find((f) => f.id === faith);

  const renderItem = ({ item }: { item: StoredMessage }) => {
    const isUser = item.sender === 'user';
    const isEmptyAi = !isUser && item.text.length === 0;
    return (
      <View style={[styles.row, isUser ? styles.rowEnd : styles.rowStart]}>
        {!isUser && (
          <View style={[styles.avatar, { backgroundColor: activeFaith?.color || colors.accent }]}>
            <Ionicons name="sparkles" size={14} color="#fff" />
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.aiBubble,
            isUser && { backgroundColor: colors.primary },
          ]}
        >
          {isEmptyAi ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Text style={[styles.bubbleText, isUser && styles.userText]}>{item.text}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.headerBar, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>AI Guide</Text>
          <Text style={styles.headerSubtitle}>
            {isPro ? 'Pro · Unlimited' : `${aiMessagesRemaining} messages left today`} · {activeFaith?.name}
          </Text>
        </View>
        <TouchableOpacity onPress={handleClear} hitSlop={10} style={styles.clearBtn}>
          <Ionicons name="trash-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.faithBar}
        contentContainerStyle={styles.faithBarContent}
      >
        {FAITH_TRADITIONS.map((f) => {
          const selected = f.id === faith;
          return (
            <TouchableOpacity
              key={f.id}
              onPress={() => setFaith(f.id)}
              style={[styles.faithChip, selected && { backgroundColor: f.color, borderColor: f.color }]}
            >
              <Text style={[styles.faithChipText, selected && { color: '#fff' }]}>{f.name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {messages.length === 0 ? (
        <ScrollView contentContainerStyle={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: activeFaith?.color || colors.accent }]}>
            <Ionicons name="sparkles" size={34} color="#fff" />
          </View>
          <Text style={styles.emptyTitle}>Ask anything...</Text>
          <Text style={styles.emptyText}>Guidance, prayers, and reflection rooted in {activeFaith?.name}.</Text>
          <View style={styles.suggestions}>
            {SUGGESTIONS.map((s) => (
              <TouchableOpacity key={s} style={styles.suggestion} onPress={() => sendText(s)}>
                <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.primary} />
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={scrollToEnd}
        />
      )}

      {outOfMessages && (
        <View style={styles.limitBanner}>
          <Ionicons name="lock-closed" size={15} color={colors.gold} />
          <Text style={styles.limitText}>Daily free limit reached. Upgrade to Pro for unlimited.</Text>
        </View>
      )}

      <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask anything..."
          placeholderTextColor={colors.textFaint}
          multiline
          editable={!outOfMessages}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || loading || outOfMessages) && styles.sendButtonDisabled]}
          onPress={() => sendText(input)}
          disabled={!input.trim() || loading || outOfMessages}
        >
          {loading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  headerTextWrap: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: 12, color: '#DCDCF7', marginTop: 2 },
  clearBtn: { padding: 6 },
  faithBar: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, flexGrow: 0 },
  faithBarContent: { paddingHorizontal: spacing.md, paddingVertical: 10 },
  faithChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  faithChipText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  listContent: { padding: spacing.lg, paddingBottom: spacing.sm },
  row: { flexDirection: 'row', marginVertical: 6, alignItems: 'flex-end' },
  rowStart: { justifyContent: 'flex-start' },
  rowEnd: { justifyContent: 'flex-end' },
  avatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  userBubble: { borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: colors.card, borderBottomLeftRadius: 4, ...shadow.soft },
  bubbleText: { fontSize: 15, lineHeight: 22, color: colors.text },
  userText: { color: '#fff' },
  empty: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 8, marginBottom: 22 },
  suggestions: { width: '100%' },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  suggestionText: { fontSize: 14, color: colors.text, fontWeight: '500', flex: 1 },
  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.goldSoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  limitText: { fontSize: 13, color: '#9A7B00', fontWeight: '600', flex: 1 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: { opacity: 0.5 },
});
