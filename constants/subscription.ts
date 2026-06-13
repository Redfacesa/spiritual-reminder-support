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
    tagline: 'Build a daily prayer habit.',
    features: [
      'Unlimited prayer reminders',
      'Unlimited saved verses',
      'Full sacred library access',
      'Daily verse inspiration',
      '3 free AI Guide messages to try',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'ZAR 115',
    period: 'per month',
    tagline: 'Your full AI spiritual companion & planner.',
    highlight: true,
    provider: PAYSTACK_PLAN.provider,
    planCode: PAYSTACK_PLAN.planCode,
    features: [
      'Everything in Free',
      'Unlimited AI Guide chat',
      'AI prayer generation',
      'Prayer Planner: weekly plan, goals & reminders',
      'Reading plans integrated into your week',
      'Sermon recording & voice-to-text',
      'AI sermon summaries & notes',
      'Priority support',
    ],
  },
];

// Free users get a small lifetime taste of the AI Guide, then it becomes Pro-only.
export const FREE_AI_TRIAL_LIMIT = 3;
