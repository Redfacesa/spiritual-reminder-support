import React, { useState, ReactNode } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, radius, shadow, spacing } from '../constants/theme';

type Mode = 'signin' | 'signup';

/**
 * Wraps the whole app. When Supabase is configured, the user must be signed in
 * before they can reach any screen. While the persisted session restores we
 * show a lightweight splash, and when there is no session we render a polished
 * full-screen sign-in / sign-up experience.
 */
export default function AuthGate({ children }: { children: ReactNode }) {
  const { configured, loading, session } = useAuth();

  // No Supabase credentials at all → don't lock people out; run as-is.
  if (!configured) return <>{children}</>;

  if (loading) return <Splash />;

  if (!session) return <SignInScreen />;

  return <>{children}</>;
}

function Splash() {
  return (
    <View style={styles.splash}>
      <View style={styles.logo}>
        <Ionicons name="sparkles" size={32} color="#fff" />
      </View>
      <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
    </View>
  );
}

function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const reset = () => {
    setError(null);
    setNotice(null);
  };

  const submit = async () => {
    reset();
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    const res =
      mode === 'signin'
        ? await signIn(email, password)
        : await signUp(email, password, name.trim() || undefined);
    setBusy(false);

    if (!res.ok) {
      setError(res.error ?? 'Something went wrong.');
      return;
    }
    if (res.needsConfirmation) {
      setNotice('Check your inbox to confirm your email, then sign in.');
      setMode('signin');
      setPassword('');
    }
    // On success with a session, the gate re-renders into the app automatically.
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.brandRow}>
            <View style={styles.logo}>
              <Ionicons name="sparkles" size={26} color="#fff" />
            </View>
            <Text style={styles.brand}>Prayer Reminder</Text>
          </View>

          <Text style={styles.title}>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</Text>
          <Text style={styles.subtitle}>
            {mode === 'signin'
              ? 'Sign in to access your prayers, verses and AI guidance.'
              : 'Sign up to start your prayer journey, synced securely across devices.'}
          </Text>

          {mode === 'signup' && (
            <Field icon="person-outline" placeholder="Name (optional)" value={name} onChangeText={setName} />
          )}
          <Field
            icon="mail-outline"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Field
            icon="lock-closed-outline"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          {error && <Text style={styles.error}>{error}</Text>}
          {notice && <Text style={styles.notice}>{notice}</Text>}

          <TouchableOpacity style={styles.primaryBtn} onPress={submit} disabled={busy} activeOpacity={0.9}>
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>{mode === 'signin' ? 'Sign In' : 'Create Account'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              reset();
              setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
            }}
            style={styles.switchBtn}
          >
            <Text style={styles.switchText}>
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <Text style={styles.switchLink}>{mode === 'signin' ? 'Sign up' : 'Sign in'}</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.legal}>
          By continuing you agree to our Terms of Service and Privacy Policy.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  icon,
  ...props
}: { icon: keyof typeof Ionicons.glyphMap } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Ionicons name={icon} size={18} color={colors.textMuted} />
      <TextInput style={styles.input} placeholderTextColor={colors.textFaint} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  splash: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.xl, alignItems: 'center' },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadow.card,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xl },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  brand: { fontSize: 18, fontWeight: '800', color: colors.text },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 6, marginBottom: spacing.xl, lineHeight: 20 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: colors.text, outlineStyle: 'none' } as any,
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing.sm },
  notice: { color: colors.success, fontSize: 13, marginBottom: spacing.sm },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...shadow.card,
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  switchBtn: { alignItems: 'center', marginTop: spacing.lg },
  switchText: { fontSize: 14, color: colors.textMuted },
  switchLink: { color: colors.primary, fontWeight: '700' },
  legal: { fontSize: 12, color: colors.textFaint, textAlign: 'center', marginTop: spacing.xl, maxWidth: 360 },
});
