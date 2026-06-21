import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../constants/theme';

import { APP_STORE_URL, PLAY_STORE_URL, ECOSYSTEM_SIBLING_APPS, REDFACE_HUB_URL, STORE_BADGE_LEAD } from '../constants/ecosystem';

const LEGAL_LINKS: { label: string; href: string }[] = [
  { label: 'Privacy Policy', href: '/welcome/privacy.html' },
  { label: 'Terms of Service', href: '/welcome/terms.html' },
  { label: 'Refund & Cancellation', href: '/welcome/refund.html' },
  { label: 'Cookie Policy', href: '/welcome/cookies.html' },
  { label: 'Data & Account Deletion', href: '/welcome/data-deletion.html' },
  { label: 'Support', href: '/welcome/support.html' },
];

function open(url: string) {
  Linking.openURL(url).catch(() => {});
}

export default function WebFooter() {
  // Web-only: this footer is meaningless on native (it has its own navigation).
  if (Platform.OS !== 'web') return null;

  const year = new Date().getFullYear();

  return (
    <View style={styles.footer}>
      <View style={styles.inner}>
        <View style={styles.columns}>
          {/* Brand / about */}
          <View style={styles.brandCol}>
            <View style={styles.brandRow}>
              <Image source={require('../assets/images/icon.png')} style={styles.mark} />
              <Text style={styles.brandName}>Prayer Reminder</Text>
            </View>
            <Text style={styles.brandText}>
              Stay faithful in prayer with reminders, sacred texts, reading plans and a thoughtful AI guide — across all your devices.
            </Text>
            <View style={styles.storeRow}>
              <TouchableOpacity style={styles.storeBtn} onPress={() => open(APP_STORE_URL)} activeOpacity={0.85}>
                <Ionicons name="logo-apple" size={18} color="#fff" />
                <Text style={styles.storeText}>App Store</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.storeBtn} onPress={() => open(PLAY_STORE_URL)} activeOpacity={0.85}>
                <Ionicons name="logo-google-playstore" size={18} color="#fff" />
                <Text style={styles.storeText}>Google Play</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Legal links */}
          <View style={styles.linkCol}>
            <Text style={styles.colHeading}>Legal</Text>
            {LEGAL_LINKS.map((l) => (
              <TouchableOpacity key={l.href} onPress={() => open(l.href)} activeOpacity={0.7}>
                <Text style={styles.link}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.linkCol}>
            <Text style={styles.colHeading}>Red Face ecosystem</Text>
            {ECOSYSTEM_SIBLING_APPS.map((app) => (
              <TouchableOpacity key={app.id} onPress={() => open(app.url)} activeOpacity={0.7}>
                <Text style={styles.link}>{app.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Contact */}
          <View style={styles.linkCol}>
            <Text style={styles.colHeading}>Contact</Text>
            <TouchableOpacity onPress={() => open('mailto:support@prayerreminder.site')} activeOpacity={0.7}>
              <Text style={styles.link}>support@prayerreminder.site</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => open('mailto:billing@prayerreminder.site')} activeOpacity={0.7}>
              <Text style={styles.link}>billing@prayerreminder.site</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => open('tel:+27617780990')} activeOpacity={0.7}>
              <Text style={styles.link}>+27 61 778 0990</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => open(REDFACE_HUB_URL)} activeOpacity={0.7}>
              <Text style={styles.link}>{REDFACE_HUB_URL.replace('https://', '')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.bottomRow}>
          <View style={styles.redFaceRow}>
            <Image source={{ uri: '/welcome/assets/redface-logo.png' }} style={styles.redFaceLogo} />
            <Text style={styles.redFaceText}>
              Built &amp; published by <Text style={styles.redFaceStrong}>Red Face (Pty) Ltd</Text>
            </Text>
          </View>
          <Text style={styles.copy}>© {year} Red Face (Pty) Ltd. All rights reserved.</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: '#0D0F1C',
    marginTop: spacing.xxl,
    paddingVertical: 44,
    paddingHorizontal: spacing.xl,
  },
  inner: { width: '100%', maxWidth: 1100, alignSelf: 'center' },
  columns: { flexDirection: 'row', flexWrap: 'wrap', gap: 40 },
  brandCol: { flexGrow: 1, flexBasis: 320, maxWidth: 420 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  mark: {
    width: 38,
    height: 38,
    borderRadius: 11,
  },
  brandName: { color: '#fff', fontSize: 18, fontWeight: '800' },
  brandText: { color: '#9CA0B8', fontSize: 14, lineHeight: 21, maxWidth: 360 },
  storeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 18 },
  storeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.md,
  },
  storeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  linkCol: { flexGrow: 1, flexBasis: 180, gap: 11 },
  colHeading: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  link: { color: '#9CA0B8', fontSize: 14, fontWeight: '500' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.10)', marginVertical: 28 },
  bottomRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  redFaceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  redFaceLogo: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#FBE4E4' },
  redFaceText: { color: '#C7CAD8', fontSize: 13 },
  redFaceStrong: { color: '#fff', fontWeight: '700' },
  copy: { color: '#80849C', fontSize: 13 },
});
