import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, radius, shadow, spacing } from '../constants/theme';

export type AuthMode = 'signin' | 'signup';

/**
 * The shared sign-in / sign-up card. Used both by the native full-screen gate
 * and the web landing page's auth overlay. On a successful, fully-authenticated
 * result it calls `onAuthenticated` (the auth gate also re-renders on its own).
 */
export default function AuthForm({
  initialMode = 'signin',
  onAuthenticated,
  showBrand = true,
}: {
  initialMode?: AuthMode;
  onAuthenticated?: () => void;
  showBrand?: boolean;
}) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
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
      return;
    }
    onAuthenticated?.();
  };

  return (
    <View>
      {showBrand && (
        <View style={styles.brandRow}>
          <Image source={require('../assets/images/icon.png')} style={styles.logo} />
          <Text style={styles.brand}>Prayer Reminder</Text>
        </View>
      )}

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
        onSubmitEditing={submit}
        returnKeyType="go"
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
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xl },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 16,
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
});
