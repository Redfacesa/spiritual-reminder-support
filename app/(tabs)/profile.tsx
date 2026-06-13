import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

import { usePrayers } from '../../context/PrayerContext';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import SubscriptionModal from '../../components/SubscriptionModal';
import AuthModal from '../../components/AuthModal';
import { FAITH_TRADITIONS } from '../../constants/faithData';
import { fetchPayments, PaymentRow } from '../../lib/repositories';
import { colors, radius, shadow, spacing } from '../../constants/theme';

function formatAmount(minor: number, currency: string) {
  const value = (minor / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${currency} ${value}`;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { prayers, streak } = usePrayers();
  const {
    name,
    isPro,
    plan,
    savedVerses,
    notificationsEnabled,
    setNotificationsEnabled,
    toggleSavedVerse,
    avatarUrl,
    setAvatar,
  } = useUser();

  const { configured, user, signOut } = useAuth();
  const router = useRouter();

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [subVisible, setSubVisible] = useState(false);
  const [savedVisible, setSavedVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [authVisible, setAuthVisible] = useState(false);
  const [paymentsVisible, setPaymentsVisible] = useState(false);
  const [payments, setPayments] = useState<PaymentRow[]>([]);

  useEffect(() => {
    if (user) fetchPayments().then(setPayments);
    else setPayments([]);
  }, [user]);

  const answered = prayers.filter((p) => p.status === 'answered').length;

  const pickAvatar = async () => {
    if (!user) {
      Alert.alert('Sign in first', 'Sign in to add a profile picture that syncs across your devices.');
      return;
    }
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Allow photo access to choose a profile picture.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const ext = asset.uri.toLowerCase().endsWith('.png') || asset.mimeType === 'image/png' ? 'png' : 'jpg';
      setUploadingAvatar(true);
      const res = await setAvatar({ base64: asset.base64, uri: asset.uri }, ext);
      setUploadingAvatar(false);
      if (!res.ok) {
        Alert.alert('Upload failed', res.error || 'Could not update your photo. Please try again.');
      }
    } catch {
      setUploadingAvatar(false);
      Alert.alert('Something went wrong', 'Could not open your photos. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.xl }]}>
          <TouchableOpacity style={styles.avatar} onPress={pickAvatar} activeOpacity={0.85}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} contentFit="cover" transition={150} />
            ) : (
              <Ionicons name="person" size={42} color={colors.primary} />
            )}
            <View style={styles.avatarBadge}>
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={15} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{name || 'Friend'}</Text>
          <View style={[styles.planBadge, isPro ? styles.proBadge : styles.freeBadge]}>
            {isPro && <Ionicons name="star" size={12} color={colors.gold} />}
            <Text style={[styles.planBadgeText, isPro && { color: colors.gold }]}>
              {isPro ? 'Pro Member' : 'Free Plan'}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Stat value={prayers.length} label="Prayers" />
          <View style={styles.statDivider} />
          <Stat value={answered} label="Answered" />
          <View style={styles.statDivider} />
          <Stat value={`${streak}d`} label="Streak" />
        </View>

        {/* Account / cloud sync */}
        {configured && (
          user ? (
            <View style={styles.section}>
              <View style={styles.settingRow}>
                <View style={[styles.settingIcon, { backgroundColor: colors.success + '18' }]}>
                  <Ionicons name="cloud-done" size={18} color={colors.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>Synced</Text>
                  <Text style={styles.settingValue}>{user.email}</Text>
                </View>
                <TouchableOpacity onPress={signOut} hitSlop={8}>
                  <Text style={styles.signOut}>Sign out</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.signInCard} onPress={() => setAuthVisible(true)} activeOpacity={0.9}>
              <View style={styles.signInIcon}>
                <Ionicons name="cloud-upload" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.signInTitle}>Sign in to sync</Text>
                <Text style={styles.signInText}>Back up your prayers, verses & AI history</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </TouchableOpacity>
          )
        )}

        {/* Subscription card */}
        {!isPro ? (
          <TouchableOpacity style={styles.upsell} onPress={() => setSubVisible(true)} activeOpacity={0.9}>
            <View style={styles.upsellIcon}>
              <Ionicons name="rocket" size={24} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.upsellTitle}>Upgrade to Pro</Text>
              <Text style={styles.upsellText}>Unlimited AI, sermon recording & more</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={styles.section}>
            <SettingRow icon="star" tint={colors.gold} label="Pro Subscription" value="Active" onPress={() => setSubVisible(true)} />
          </View>
        )}

        {/* My Account */}
        <Text style={styles.sectionLabel}>My Account</Text>
        <View style={styles.section}>
          <SettingRow icon="bookmark" tint={colors.accent} label="Saved Verses" value={`${savedVerses.length}`} onPress={() => setSavedVisible(true)} />
          <Divider />
          <SettingRow icon="time" tint="#0EA5E9" label="Prayer History" value={`${prayers.length}`} onPress={() => setHistoryVisible(true)} />
          <Divider />
          <SettingRow icon="card" tint={colors.primary} label="Subscription" value={isPro ? 'Pro' : 'Free'} onPress={() => setSubVisible(true)} />
          {user && (
            <>
              <Divider />
              <SettingRow icon="receipt" tint={colors.success} label="Payment History" value={`${payments.length}`} onPress={() => setPaymentsVisible(true)} />
            </>
          )}
        </View>

        {/* Spiritual tools */}
        <Text style={styles.sectionLabel}>Spiritual Tools</Text>
        <View style={styles.section}>
          <SettingRow icon="calendar" tint={colors.primary} label="Prayer Planner" value={isPro ? undefined : 'Pro'} onPress={() => router.push('/planner')} />
          <Divider />
          <SettingRow icon="mic" tint="#EC4899" label="Sermon Notes" value={isPro ? undefined : 'Pro'} onPress={() => router.push('/sermons')} />
          <Divider />
          <SettingRow icon="map" tint="#0EA5E9" label="Reading Plans" onPress={() => router.push('/(tabs)/library')} />
        </View>

        {/* Preferences */}
        <Text style={styles.sectionLabel}>Preferences</Text>
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: '#EC489918' }]}>
              <Ionicons name="notifications" size={18} color="#EC4899" />
            </View>
            <Text style={styles.settingLabel}>Prayer Reminders</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ true: colors.primary, false: '#D7D9E4' }}
              thumbColor="#fff"
            />
          </View>
          <Divider />
          <SettingRow icon="settings" tint={colors.textMuted} label="Settings" onPress={() => router.push('/settings')} />
        </View>

        <Text style={styles.footer}>Prayer Reminder & Spiritual Guide</Text>
      </ScrollView>

      <SubscriptionModal visible={subVisible} onClose={() => setSubVisible(false)} />
      <AuthModal visible={authVisible} onClose={() => setAuthVisible(false)} />

      {/* Payment History modal */}
      <ListSheet
        visible={paymentsVisible}
        title="Payment History"
        onClose={() => setPaymentsVisible(false)}
        empty={payments.length === 0}
        emptyText="No payments yet. Upgrade to Pro to get started."
      >
        {payments.map((p) => (
          <View key={p.id} style={[styles.historyCard, { borderLeftColor: colors.success }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.historyTopic}>{formatAmount(p.amount, p.currency)}</Text>
              <Text style={styles.historyMeta}>
                {new Date(p.paid_at || p.created_at).toLocaleDateString()} • {p.reference}
              </Text>
            </View>
            <Text style={styles.historyStatus}>{p.status}</Text>
          </View>
        ))}
      </ListSheet>

      {/* Saved Verses modal */}
      <ListSheet
        visible={savedVisible}
        title="Saved Verses"
        onClose={() => setSavedVisible(false)}
        empty={savedVerses.length === 0}
        emptyText="No saved verses yet. Tap the bookmark on any verse to save it."
      >
        {savedVerses.map((v, i) => (
          <View key={i} style={styles.verseCard}>
            <View style={styles.verseHeader}>
              <Text style={styles.verseRef}>{v.ref}</Text>
              <TouchableOpacity onPress={() => toggleSavedVerse(v)} hitSlop={8}>
                <Ionicons name="bookmark" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.verseText}>{v.text}</Text>
          </View>
        ))}
      </ListSheet>

      {/* Prayer History modal */}
      <ListSheet
        visible={historyVisible}
        title="Prayer History"
        onClose={() => setHistoryVisible(false)}
        empty={prayers.length === 0}
        emptyText="No prayers yet."
      >
        {prayers.map((p) => {
          const f = FAITH_TRADITIONS.find((x) => x.id === p.faith);
          return (
            <View key={p.id} style={[styles.historyCard, { borderLeftColor: f?.color || colors.accent }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyTopic}>{p.topic}</Text>
                <Text style={styles.historyMeta}>{f?.name} • {p.reminderTime}</Text>
              </View>
              <Text style={styles.historyStatus}>{p.status}</Text>
            </View>
          );
        })}
      </ListSheet>
    </View>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SettingRow({
  icon,
  tint,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  label: string;
  value?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.settingIcon, { backgroundColor: tint + '18' }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <Text style={styles.settingLabel}>{label}</Text>
      {value !== undefined && <Text style={styles.settingValue}>{value}</Text>}
      <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={styles.rowDivider} />;
}

function ListSheet({
  visible,
  title,
  onClose,
  empty,
  emptyText,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  empty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.listSheet}>
          <View style={styles.handle} />
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
            {empty ? <Text style={styles.emptyText}>{emptyText}</Text> : children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { alignItems: 'center', paddingBottom: spacing.xl, backgroundColor: colors.card },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarImage: { width: 88, height: 88, borderRadius: 44 },
  avatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.card,
  },
  name: { fontSize: 22, fontWeight: '800', color: colors.text },
  planBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill, marginTop: 8 },
  freeBadge: { backgroundColor: colors.primaryLight },
  proBadge: { backgroundColor: colors.goldSoft },
  planBadgeText: { fontSize: 12, fontWeight: '700', color: colors.primary },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.soft,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: colors.border },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 4 },

  upsell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary,
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  upsellIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  upsellTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  upsellText: { color: '#DCDCF7', fontSize: 13, marginTop: 2 },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.xl,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.xl,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.soft,
  },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  settingIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  settingLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  settingValue: { fontSize: 14, color: colors.textMuted, marginRight: 6 },
  rowDivider: { height: 1, backgroundColor: colors.border, marginLeft: 64 },

  signOut: { fontSize: 14, fontWeight: '700', color: colors.danger },
  signInCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    ...shadow.soft,
  },
  signInIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  signInTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  signInText: { fontSize: 13, color: colors.textMuted, marginTop: 2 },

  footer: { textAlign: 'center', color: colors.textFaint, fontSize: 12, marginTop: spacing.xxl },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  listSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingTop: spacing.md,
    maxHeight: '85%',
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: spacing.md },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  listTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingVertical: 40, paddingHorizontal: 20 },

  verseCard: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.md, ...shadow.soft },
  verseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  verseRef: { fontSize: 14, fontWeight: '700', color: colors.primary },
  verseText: { fontSize: 14, lineHeight: 21, color: colors.text },

  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    ...shadow.soft,
  },
  historyTopic: { fontSize: 15, fontWeight: '600', color: colors.text },
  historyMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  historyStatus: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'capitalize' },
});
