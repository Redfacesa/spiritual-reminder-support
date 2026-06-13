import React, { ReactNode } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import AuthForm from './AuthForm';
import WebLanding from './WebLanding';
import { colors, radius, shadow, spacing } from '../constants/theme';

/**
 * Wraps the whole app. When Supabase is configured, the user must be signed in
 * before they can reach any feature.
 *   - While the persisted session restores → lightweight splash.
 *   - Signed out on web → marketing landing page with sign-in / sign-up.
 *   - Signed out on native → full-screen sign-in card.
 */
export default function AuthGate({ children }: { children: ReactNode }) {
  const { configured, loading, session } = useAuth();

  if (!configured) return <>{children}</>;
  if (loading) return <Splash />;

  if (!session) {
    return Platform.OS === 'web' ? <WebLanding /> : <NativeSignIn />;
  }

  return <>{children}</>;
}

function Splash() {
  return (
    <View style={styles.splash}>
      <Image source={require('../assets/images/icon.png')} style={styles.logo} />
      <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
    </View>
  );
}

function NativeSignIn() {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <AuthForm initialMode="signin" />
        </View>
        <Text style={styles.legal}>By continuing you agree to our Terms of Service and Privacy Policy.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  splash: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 22,
    ...shadow.soft,
  },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.xl, alignItems: 'center' },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadow.card,
  },
  legal: { fontSize: 12, color: colors.textFaint, textAlign: 'center', marginTop: spacing.xl, maxWidth: 360 },
});
