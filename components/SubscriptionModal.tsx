import React, { useEffect, useState } from 'react';
import { View, Text, Modal, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PLANS, SUBSCRIPTION_LINKS, PlanId, getProPrice } from '../constants/subscription';
import { useUser } from '../context/UserContext';
import { cancelProSubscription } from '../lib/repositories';
import { colors, radius, shadow, spacing } from '../constants/theme';

const BILLING_EMAIL = 'billing@prayerreminder.site';

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SubscriptionModal({ visible, onClose }: SubscriptionModalProps) {
  const { plan, isPro, setPlan, refreshSubscription } = useUser();
  const proPrice = getProPrice();

  const [confirmCancel, setConfirmCancel] = useState(false);
  const [canceling, setCanceling] = useState(false);

  // When the sheet opens, pull the latest plan from Supabase so a Pro upgrade
  // completed on the Paystack page is reflected here.
  useEffect(() => {
    if (visible) refreshSubscription();
    else setConfirmCancel(false);
  }, [visible, refreshSubscription]);

  const handleCancel = async () => {
    setCanceling(true);
    const result = await cancelProSubscription();
    setCanceling(false);
    setConfirmCancel(false);
    if (result.ok) {
      setPlan('free');
      await refreshSubscription();
      Alert.alert('Subscription cancelled', 'You are back on the Free plan. You can resubscribe anytime.');
    } else {
      Alert.alert(
        'Could not cancel automatically',
        `${result.error ?? 'Something went wrong.'}\n\nEmail ${BILLING_EMAIL} and we will cancel it for you right away.`
      );
    }
  };

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

            {isPro ? (
              <View style={styles.cancelBox}>
                {!confirmCancel ? (
                  <TouchableOpacity style={styles.cancelLink} onPress={() => setConfirmCancel(true)}>
                    <Ionicons name="close-circle-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.cancelText}>Cancel subscription</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.confirmWrap}>
                    <Text style={styles.confirmTitle}>Cancel your Pro subscription?</Text>
                    <Text style={styles.confirmText}>
                      You'll keep Pro until the end of your current billing period, then move to Free. No further charges.
                    </Text>
                    <View style={styles.confirmRow}>
                      <TouchableOpacity
                        style={[styles.confirmBtn, styles.keepBtn]}
                        onPress={() => setConfirmCancel(false)}
                        disabled={canceling}
                      >
                        <Text style={styles.keepText}>Keep Pro</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.confirmBtn, styles.cancelConfirmBtn]}
                        onPress={handleCancel}
                        disabled={canceling}
                      >
                        {canceling ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.cancelConfirmText}>Yes, cancel</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <TouchableOpacity style={styles.manageLink} onPress={() => openLink(SUBSCRIPTION_LINKS.manage)}>
                <Text style={styles.manageText}>Manage existing subscription</Text>
              </TouchableOpacity>
            )}
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

  cancelBox: { marginTop: spacing.sm },
  cancelLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.md,
  },
  cancelText: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  confirmWrap: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  confirmTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  confirmText: { fontSize: 13, color: colors.textMuted, marginTop: 6, lineHeight: 19 },
  confirmRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  keepBtn: { backgroundColor: colors.primaryLight },
  keepText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  cancelConfirmBtn: { backgroundColor: colors.danger },
  cancelConfirmText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
