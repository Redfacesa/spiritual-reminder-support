import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AuthForm, { AuthMode } from './AuthForm';
import WebFooter from './WebFooter';
import { colors, radius, shadow, spacing } from '../constants/theme';

const APP_STORE_URL = 'https://apps.apple.com/us/app/prayer-reminder/id6755526671';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.prayer.reminder.app';

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; tint: string; title: string; text: string }[] = [
  { icon: 'notifications', tint: '#EC4899', title: 'Prayer Reminders', text: 'Schedule recurring reminders so you never miss a moment of prayer.' },
  { icon: 'sparkles', tint: '#9370DB', title: 'AI Spiritual Guide', text: 'Faith-aware guidance and encouragement, available whenever you need it.' },
  { icon: 'book', tint: '#0EA5E9', title: 'Sacred Texts', text: 'Read and save verses across multiple faith traditions in one place.' },
  { icon: 'map', tint: '#22C55E', title: 'Reading Plans', text: 'Follow guided plans to build a consistent, meaningful routine.' },
  { icon: 'mic', tint: '#F59E0B', title: 'Sermon Notes', text: 'Record, transcribe and summarize sermons so nothing is lost.' },
  { icon: 'cloud-done', tint: '#5B5BD6', title: 'Synced Everywhere', text: 'Your prayers and history stay in sync across web and mobile.' },
];

export default function WebLanding() {
  const { width } = useWindowDimensions();
  const isNarrow = width < 880;
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);

  const openLink = (url: string) => Linking.openURL(url).catch(() => {});

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 0 }}>
        {/* Nav */}
        <View style={styles.nav}>
          <View style={styles.navInner}>
            <View style={styles.brandRow}>
              <Image source={require('../assets/images/icon.png')} style={styles.mark} />
              <Text style={styles.brandName}>Prayer Reminder</Text>
            </View>
            <View style={styles.navActions}>
              <TouchableOpacity onPress={() => setAuthMode('signin')} style={styles.navSignIn} activeOpacity={0.7}>
                <Text style={styles.navSignInText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setAuthMode('signup')} style={styles.navCta} activeOpacity={0.85}>
                <Text style={styles.navCtaText}>Get Started</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Hero */}
        <View style={styles.heroWrap}>
          <View style={[styles.hero, isNarrow && styles.heroNarrow]}>
            <View style={styles.heroCopy}>
              <View style={styles.eyebrow}>
                <Ionicons name="sparkles" size={14} color={colors.primary} />
                <Text style={styles.eyebrowText}>Faith, focus & daily prayer</Text>
              </View>
              <Text style={styles.heroTitle}>Stay faithful in prayer, every single day.</Text>
              <Text style={styles.heroText}>
                Prayer Reminder helps you build a consistent spiritual rhythm with smart reminders, sacred
                texts, guided reading plans and a thoughtful AI companion — across all your devices.
              </Text>

              <View style={styles.heroActions}>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => setAuthMode('signup')} activeOpacity={0.9}>
                  <Text style={styles.primaryBtnText}>Get Started Free</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.ghostBtn} onPress={() => setAuthMode('signin')} activeOpacity={0.8}>
                  <Text style={styles.ghostBtnText}>I already have an account</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.heroNote}>Free to start • Sign up takes less than a minute</Text>
            </View>

            {!isNarrow && (
              <View style={styles.heroMedia}>
                <Image source={{ uri: '/welcome/assets/hero.png' }} style={styles.heroImage} resizeMode="cover" />
              </View>
            )}
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>WHAT YOU GET</Text>
          <Text style={styles.sectionTitle}>Everything you need for a deeper prayer life</Text>
          <View style={styles.featureGrid}>
            {FEATURES.map((f) => (
              <View key={f.title} style={[styles.featureCard, isNarrow && styles.featureCardNarrow]}>
                <View style={[styles.featureIcon, { backgroundColor: f.tint + '18' }]}>
                  <Ionicons name={f.icon} size={22} color={f.tint} />
                </View>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Sign-up CTA band */}
        <View style={styles.ctaBand}>
          <View style={styles.ctaInner}>
            <Text style={styles.ctaTitle}>Create your free account to begin</Text>
            <Text style={styles.ctaText}>
              Sign up or sign in to unlock prayers, the AI guide, reading plans and more.
            </Text>
            <View style={styles.ctaActions}>
              <TouchableOpacity style={styles.ctaPrimary} onPress={() => setAuthMode('signup')} activeOpacity={0.9}>
                <Text style={styles.ctaPrimaryText}>Get Started Free</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ctaSecondary} onPress={() => setAuthMode('signin')} activeOpacity={0.85}>
                <Text style={styles.ctaSecondaryText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Mobile download */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>ON THE GO</Text>
          <Text style={styles.sectionTitle}>Take your prayer journey anywhere</Text>
          <Text style={styles.downloadText}>Download the mobile app for iOS and Android — your data stays in sync.</Text>
          <View style={styles.storeRow}>
            <TouchableOpacity style={styles.storeBtn} onPress={() => openLink(APP_STORE_URL)} activeOpacity={0.85}>
              <Ionicons name="logo-apple" size={22} color="#fff" />
              <View>
                <Text style={styles.storeSmall}>Download on the</Text>
                <Text style={styles.storeStrong}>App Store</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.storeBtnDark} onPress={() => openLink(PLAY_STORE_URL)} activeOpacity={0.85}>
              <Ionicons name="logo-google-playstore" size={22} color="#fff" />
              <View>
                <Text style={styles.storeSmall}>Get it on</Text>
                <Text style={styles.storeStrong}>Google Play</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <WebFooter />
      </ScrollView>

      {/* Auth overlay */}
      <Modal visible={authMode !== null} animationType="fade" transparent onRequestClose={() => setAuthMode(null)}>
        <View style={styles.overlay}>
          <View style={styles.authCard}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setAuthMode(null)} hitSlop={10}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
            {authMode && <AuthForm initialMode={authMode} onAuthenticated={() => setAuthMode(null)} />}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  nav: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  navInner: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 36, height: 36, borderRadius: 11 },
  brandName: { fontSize: 17, fontWeight: '800', color: colors.text },
  navActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  navSignIn: { paddingHorizontal: 12, paddingVertical: 9 },
  navSignInText: { fontSize: 14, fontWeight: '700', color: colors.text },
  navCta: { backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: radius.pill },
  navCtaText: { fontSize: 14, fontWeight: '800', color: '#fff' },

  heroWrap: { paddingHorizontal: spacing.xl, paddingTop: 56, paddingBottom: 40 },
  hero: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 48,
  },
  heroNarrow: { flexDirection: 'column', gap: spacing.xl },
  heroCopy: { flex: 1 },
  eyebrow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    marginBottom: spacing.lg,
  },
  eyebrowText: { color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 0.4 },
  heroTitle: { fontSize: 46, lineHeight: 52, fontWeight: '900', color: colors.text, letterSpacing: -0.5, maxWidth: 560 },
  heroText: { fontSize: 17, lineHeight: 27, color: colors.textMuted, marginTop: spacing.lg, maxWidth: 520 },
  heroActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.xl },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderRadius: radius.md,
    ...shadow.card,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  ghostBtn: {
    paddingHorizontal: 22,
    paddingVertical: 15,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  ghostBtnText: { color: colors.text, fontSize: 15, fontWeight: '700' },
  heroNote: { fontSize: 13, color: colors.textFaint, marginTop: spacing.lg },
  heroMedia: { flex: 1 },
  heroImage: { width: '100%', height: 420, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border },

  section: { width: '100%', maxWidth: 1100, alignSelf: 'center', paddingHorizontal: spacing.xl, paddingVertical: 48 },
  sectionEyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1, color: colors.primary, marginBottom: 8 },
  sectionTitle: { fontSize: 30, fontWeight: '800', color: colors.text, letterSpacing: -0.3, maxWidth: 560 },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, marginTop: spacing.xl },
  featureCard: {
    flexGrow: 1,
    flexBasis: 300,
    maxWidth: 340,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.soft,
  },
  featureCardNarrow: { maxWidth: '100%' },
  featureIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  featureTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 6 },
  featureText: { fontSize: 14, lineHeight: 21, color: colors.textMuted },

  ctaBand: { backgroundColor: colors.primary, paddingVertical: 56, paddingHorizontal: spacing.xl },
  ctaInner: { width: '100%', maxWidth: 720, alignSelf: 'center', alignItems: 'center' },
  ctaTitle: { fontSize: 30, fontWeight: '900', color: '#fff', textAlign: 'center', letterSpacing: -0.3 },
  ctaText: { fontSize: 16, color: '#DCDCF7', textAlign: 'center', marginTop: spacing.md, lineHeight: 24 },
  ctaActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.md, marginTop: spacing.xl },
  ctaPrimary: { backgroundColor: '#fff', paddingHorizontal: 26, paddingVertical: 14, borderRadius: radius.md },
  ctaPrimaryText: { color: colors.primary, fontSize: 16, fontWeight: '800' },
  ctaSecondary: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', paddingHorizontal: 26, paddingVertical: 14, borderRadius: radius.md },
  ctaSecondaryText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  downloadText: { fontSize: 16, color: colors.textMuted, marginTop: spacing.md, maxWidth: 520 },
  storeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.xl },
  storeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.md,
    ...shadow.soft,
  },
  storeBtnDark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#101322',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.md,
    ...shadow.soft,
  },
  storeSmall: { color: 'rgba(255,255,255,0.78)', fontSize: 10, fontWeight: '600' },
  storeStrong: { color: '#fff', fontSize: 15, fontWeight: '800', marginTop: 1 },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(13,15,28,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  authCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadow.card,
  },
  closeBtn: { position: 'absolute', top: spacing.md, right: spacing.md, zIndex: 2, padding: 4 },
});
