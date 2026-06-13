import React, { useEffect } from 'react';
import { View, Text, Modal, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PLANS, SUBSCRIPTION_LINKS, PlanId, getProPrice } from '../constants/subscription';
import { useUser } from '../context/UserContext';
import { colors, radius, shadow, spacing } from '../constants/theme';

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SubscriptionModal({ visible, onClose }: SubscriptionModalProps) {
  const { plan, setPlan, refreshSubscription } = useUser();
  const proPrice = getProPrice();

  // When the sheet opens, pull the latest plan from Supabase so a Pro upgrade
  // completed on the Paystack page is reflected here.
  useEffect(() => {
    if (visible) refreshSubscription();
  }, [visible, refreshSubscription]);

  const openLink = async (url: string) => {
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) await Linking.openURL(url);
      else Alert.alert('Link unavailable', 'The subscription page could not be opened.');
    } catch {
      Alert.alert('Link unavailable', 'The subscription page could not be opened.');
    }
  };

  const choosePlan = (id: PlanId) => {
    if (id === 'pro') {
      // Pro is granted by the Paystack webhook after a verified payment, not on tap.
      openLink(SUBSCRIPTION_LINKS.pro);
      Alert.alert(
        'Complete your payment',
        'After your payment succeeds, Pro activates automatically. Reopen this screen to refresh your status.'
      );
      return;
    }
    setPlan(id);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Choose your plan</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
            {PLANS.map((p) => {
              const current = plan === p.id;
              return (
                <View key={p.id} style={[styles.planCard, p.highlight && styles.planHighlight]}>
                  {p.highlight && (
                    <View style={styles.popular}>
                      <Text style={styles.popularText}>MOST POPULAR</Text>
                    </View>
                  )}
                  <Text style={styles.planName}>{p.name}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>{p.id === 'pro' ? proPrice.display : p.price}</Text>
                    <Text style={styles.period}>/{p.period}</Text>
                  </View>
                  <Text style={styles.tagline}>{p.tagline}</Text>

                  <View style={styles.features}>
                    {p.features.map((f) => (
                      <View key={f} style={styles.featureRow}>
                        <Ionicons name="checkmark-circle" size={18} color={p.highlight ? colors.primary : colors.success} />
                        <Text style={styles.featureText}>{f}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.cta,
                      p.highlight ? styles.ctaPrimary : styles.ctaGhost,
                      current && styles.ctaCurrent,
                    ]}
                    onPress={() => choosePlan(p.id)}
                    disabled={current}
                  >
                    <Text style={[styles.ctaText, !p.highlight && !current && styles.ctaGhostText]}>
                      {current ? 'Current Plan' : p.id === 'pro' ? 'Upgrade to Pro' : 'Switch to Free'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}

            <TouchableOpacity style={styles.manageLink} onPress={() => openLink(SUBSCRIPTION_LINKS.manage)}>
              <Text style={styles.manageText}>Manage existing subscription</Text>
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
    maxHeight: '92%',
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  planCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
    ...shadow.soft,
  },
  planHighlight: { borderColor: colors.primary },
  popular: {
    position: 'absolute',
    top: -10,
    right: spacing.xl,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  popularText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  planName: { fontSize: 18, fontWeight: '800', color: colors.text },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 4 },
  price: { fontSize: 32, fontWeight: '800', color: colors.text },
  period: { fontSize: 14, color: colors.textMuted, marginBottom: 6, marginLeft: 4 },
  tagline: { fontSize: 13, color: colors.textMuted, marginTop: 4, marginBottom: spacing.lg },
  features: { gap: 10, marginBottom: spacing.xl },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontSize: 14, color: colors.text, flex: 1 },
  cta: { paddingVertical: 14, borderRadius: radius.md, alignItems: 'center' },
  ctaPrimary: { backgroundColor: colors.primary },
  ctaGhost: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  ctaCurrent: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  ctaText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  ctaGhostText: { color: colors.text },
  manageLink: { alignItems: 'center', paddingVertical: spacing.md },
  manageText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
});
