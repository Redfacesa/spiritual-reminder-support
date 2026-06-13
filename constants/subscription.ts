// Subscription plans and checkout links. Profile > Subscription opens these.
import * as Localization from 'expo-localization';

export const SUBSCRIPTION_LINKS = {
  free: '',
  pro: 'https://paystack.shop/pay/pvn6qjvh-3',
  // Paystack does not provide a self-serve manage URL from the payment page.
  manage: 'https://paystack.shop/pay/pvn6qjvh-3',
};

export const PAYSTACK_PLAN = {
  provider: 'paystack',
  planCode: 'PLN_fnhh863hb4apg8d',
  currency: 'ZAR',
  amount: 11500, // Paystack amount in kobo/cents.
  interval: 'monthly',
};

// Pro is billed in ZAR by Paystack (~$7). We localise the *displayed* price by
// region so users see a familiar currency; the actual charge stays ZAR 115.
export interface ProPrice {
  display: string;
  currency: string;
}

const PRO_PRICE_BY_CURRENCY: Record<string, ProPrice> = {
  ZAR: { display: 'R115', currency: 'ZAR' },
  USD: { display: '$7', currency: 'USD' },
  EUR: { display: '€7', currency: 'EUR' },
  GBP: { display: '£6', currency: 'GBP' },
  NGN: { display: '₦10,000', currency: 'NGN' },
  KES: { display: 'KSh 900', currency: 'KES' },
  GHS: { display: 'GH₵100', currency: 'GHS' },
};

const ZAR_REGIONS = ['ZA'];

/** Picks a display price based on the device's region/currency. */
export function getProPrice(): ProPrice {
  try {
    const locale = Localization.getLocales?.()?.[0];
    const region = locale?.regionCode ?? undefined;
    const currency = locale?.currencyCode ?? undefined;

    if (region && ZAR_REGIONS.includes(region)) return PRO_PRICE_BY_CURRENCY.ZAR;
    if (currency && PRO_PRICE_BY_CURRENCY[currency]) return PRO_PRICE_BY_CURRENCY[currency];
  } catch {
    // Localization can be unavailable on some platforms — fall through.
  }
  return PRO_PRICE_BY_CURRENCY.USD;
}

export type PlanId = 'free' | 'pro';

export interface Plan {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  tagline: string;
  features: string[];
  highlight?: boolean;
  provider?: string;
  planCode?: string;
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    tagline: 'Everything you need to build a prayer habit.',
    features: [
      'Unlimited prayer reminders',
      'Unlimited saved verses',
      'Full sacred library access',
      '20 AI Guide messages / day',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'ZAR 115',
    period: 'per month',
    tagline: 'Unlock the full spiritual companion.',
    highlight: true,
    provider: PAYSTACK_PLAN.provider,
    planCode: PAYSTACK_PLAN.planCode,
    features: [
      'Everything in Free',
      'Unlimited AI Guide messages',
      'AI prayer generation',
      'Sermon recording & voice-to-text',
      'AI sermon summaries & notes',
      'Priority support',
    ],
  },
];

// Free-tier daily AI message allowance.
export const FREE_AI_DAILY_LIMIT = 20;
