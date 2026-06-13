import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import { FAITH_TRADITIONS } from '../constants/faithData';
import { requestPermissions } from '../utils/notificationHelper';
import { colors, radius, shadow, spacing } from '../constants/theme';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut, configured } = useAuth();
  const {
    name,
    setName,
    faith,
    setFaith,
    notificationsEnabled,
    setNotificationsEnabled,
    reminderSound,
    setReminderSound,
    dailyVerseEnabled,
    setDailyVerseEnabled,
  } = useUser();

  const [draftName, setDraftName] = useState(name);
  const [authVisible, setAuthVisible] = useState(false);

  const saveName = () => {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== name) setName(trimmed);
  };

  const handleNotificationsToggle = async (value: boolean) => {
    if (value && Platform.OS !== 'web') {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          'Notifications blocked',
          'Enable notifications for this app in your device settings to receive prayer reminders.'
        );
        return;
      }
    }
    setNotificationsEnabled(value);
  };

  const confirmSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backRow} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
          <Text style={styles.backText}>Profile</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
        {/* Profile */}
        <Text style={styles.sectionLabel}>Profile</Text>
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>Display name</Text>
          <TextInput
            style={styles.input}
            value={draftName}
            onChangeText={setDraftName}
            onBlur={saveName}
            onSubmitEditing={saveName}
            placeholder="Your name"
            placeholderTextColor={colors.textFaint}
            returnKeyType="done"
          />

          <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>Primary faith</Text>
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
        </View>

        {/* Notifications */}
        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.section}>
          <Row icon="notifications" tint="#EC4899" label="Prayer reminders">
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              trackColor={{ true: colors.primary, false: '#D7D9E4' }}
              thumbColor="#fff"
            />
          </Row>
          <Divider />
          <Row icon="volume-high" tint="#0EA5E9" label="Reminder sound">
            <Switch
              value={reminderSound}
              onValueChange={setReminderSound}
              trackColor={{ true: colors.primary, false: '#D7D9E4' }}
              thumbColor="#fff"
            />
          </Row>
        </View>

        {/* Content */}
        <Text style={styles.sectionLabel}>Content</Text>
        <View style={styles.section}>
          <Row icon="sparkles" tint={colors.accent} label="Daily inspiration">
            <Switch
              value={dailyVerseEnabled}
              onValueChange={setDailyVerseEnabled}
              trackColor={{ true: colors.primary, false: '#D7D9E4' }}
              thumbColor="#fff"
            />
          </Row>
        </View>

        {/* Account */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.section}>
          {user ? (
            <>
              <Row icon="mail" tint={colors.primary} label="Email">
                <Text style={styles.value}>{user.email}</Text>
              </Row>
              <Divider />
              <TouchableOpacity style={styles.rowBtn} onPress={confirmSignOut}>
                <View style={[styles.rowIcon, { backgroundColor: colors.dangerSoft }]}>
                  <Ionicons name="log-out-outline" size={18} color={colors.danger} />
                </View>
                <Text style={[styles.rowLabel, { color: colors.danger }]}>Sign out</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Row icon="cloud-offline" tint={colors.textMuted} label="Not signed in">
                <Text style={styles.value}>{configured ? 'Sync off' : 'Local only'}</Text>
              </Row>
              {configured && (
                <>
                  <Divider />
                  <TouchableOpacity style={styles.rowBtn} onPress={() => setAuthVisible(true)}>
                    <View style={[styles.rowIcon, { backgroundColor: colors.primaryLight }]}>
                      <Ionicons name="log-in-outline" size={18} color={colors.primary} />
                    </View>
                    <Text style={[styles.rowLabel, { color: colors.primary }]}>Sign in / Create account</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
        </View>

        <Text style={styles.footer}>Prayer Reminder & Spiritual Guide · v1.0.0</Text>
      </ScrollView>

      <AuthModal visible={authVisible} onClose={() => setAuthVisible(false)} />
    </View>
  );
}

function Row({
  icon,
  tint,
  label,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: tint + '18' }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
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
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  backText: { fontSize: 15, fontWeight: '600', color: colors.primary },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, ...shadow.soft },

  fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
  },
  faithGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  faithBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  faithText: { fontSize: 13, fontWeight: '600', color: colors.text },

  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 6 },
  rowBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 6 },
  rowIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  value: { fontSize: 14, color: colors.textMuted },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm, marginLeft: 48 },

  footer: { textAlign: 'center', color: colors.textFaint, fontSize: 12, marginTop: spacing.xxl },
});
