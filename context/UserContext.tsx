import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { PlanId, FREE_AI_TRIAL_LIMIT } from '../constants/subscription';
import { useAuth } from './AuthContext';
import {
  fetchProfile,
  updateProfile,
  fetchSettings,
  updateSettings,
  fetchPlan,
  updatePlan,
  fetchSavedVerses,
  upsertSavedVerse,
  deleteSavedVerse,
  fetchAiMessagesTotal,
  incrementAiUsage,
} from '../lib/repositories';

export interface SavedVerse {
  ref: string;
  text: string;
  faith: string;
}

interface UserContextType {
  name: string;
  setName: (name: string) => void;
  faith: string;
  setFaith: (faith: string) => void;

  plan: PlanId;
  isPro: boolean;
  setPlan: (plan: PlanId) => void;
  refreshSubscription: () => Promise<void>;

  notificationsEnabled: boolean;
  setNotificationsEnabled: (v: boolean) => void;
  reminderSound: boolean;
  setReminderSound: (v: boolean) => void;
  dailyVerseEnabled: boolean;
  setDailyVerseEnabled: (v: boolean) => void;

  savedVerses: SavedVerse[];
  isVerseSaved: (ref: string) => boolean;
  toggleSavedVerse: (verse: SavedVerse) => void;

  aiMessagesUsed: number;
  aiMessagesRemaining: number;
  registerAiMessage: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Best-effort display name from the auth user (used until the profile loads,
// and as a sensible default so the greeting is never a hardcoded placeholder).
function deriveNameFromUser(user: { email?: string | null; user_metadata?: Record<string, any> } | null): string {
  if (!user) return '';
  const meta = user.user_metadata ?? {};
  const fromMeta = meta.display_name || meta.full_name || meta.name;
  if (fromMeta) return String(fromMeta);
  if (user.email) return user.email.split('@')[0];
  return '';
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { userId, user } = useAuth();
  const [name, setNameState] = useState('');
  const [faith, setFaithState] = useState('christianity');
  const [plan, setPlanState] = useState<PlanId>('free');
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);
  const [reminderSound, setReminderSoundState] = useState(true);
  const [dailyVerseEnabled, setDailyVerseEnabledState] = useState(true);
  const [savedVerses, setSavedVerses] = useState<SavedVerse[]>([]);
  const [aiMessagesUsed, setAiMessagesUsed] = useState(0);

  const isPro = plan === 'pro';

  // Hydrate from Supabase when a user signs in; clear everything on sign-out so
  // no data bleeds between accounts on the same device.
  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setNameState('');
      setFaithState('christianity');
      setPlanState('free');
      setNotificationsEnabledState(true);
      setReminderSoundState(true);
      setDailyVerseEnabledState(true);
      setSavedVerses([]);
      setAiMessagesUsed(0);
      return;
    }
    // Immediate per-user fallback so the greeting is personalised right away.
    setNameState(deriveNameFromUser(user));
    (async () => {
      const [profile, settings, planId, verses, aiUsed] = await Promise.all([
        fetchProfile(userId),
        fetchSettings(userId),
        fetchPlan(userId),
        fetchSavedVerses(),
        fetchAiMessagesTotal(userId),
      ]);
      if (cancelled) return;
      if (profile) {
        if (profile.name) setNameState(profile.name);
        setFaithState(profile.faith);
      }
      if (settings) {
        setNotificationsEnabledState(settings.notifications_enabled);
        setReminderSoundState(settings.reminder_sound);
        setDailyVerseEnabledState(settings.daily_verse_enabled);
      }
      if (planId) setPlanState(planId);
      setSavedVerses(verses);
      setAiMessagesUsed(aiUsed);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, user]);

  const setName = useCallback(
    (value: string) => {
      setNameState(value);
      if (userId) updateProfile(userId, { name: value });
    },
    [userId]
  );

  const setFaith = useCallback(
    (value: string) => {
      setFaithState(value);
      if (userId) updateProfile(userId, { faith: value as any });
    },
    [userId]
  );

  const setPlan = useCallback(
    (value: PlanId) => {
      setPlanState(value);
      if (userId) updatePlan(userId, value);
    },
    [userId]
  );

  const setNotificationsEnabled = useCallback(
    (value: boolean) => {
      setNotificationsEnabledState(value);
      if (userId) updateSettings(userId, { notifications_enabled: value });
    },
    [userId]
  );

  const setReminderSound = useCallback(
    (value: boolean) => {
      setReminderSoundState(value);
      if (userId) updateSettings(userId, { reminder_sound: value });
    },
    [userId]
  );

  const setDailyVerseEnabled = useCallback(
    (value: boolean) => {
      setDailyVerseEnabledState(value);
      if (userId) updateSettings(userId, { daily_verse_enabled: value });
    },
    [userId]
  );

  // Re-fetch the plan from Supabase (e.g. after a Paystack payment activates Pro).
  const refreshSubscription = useCallback(async () => {
    if (!userId) return;
    const planId = await fetchPlan(userId);
    if (planId) setPlanState(planId);
  }, [userId]);

  const isVerseSaved = useCallback(
    (ref: string) => savedVerses.some((v) => v.ref === ref),
    [savedVerses]
  );

  const toggleSavedVerse = useCallback(
    (verse: SavedVerse) => {
      setSavedVerses((prev) => {
        const exists = prev.some((v) => v.ref === verse.ref);
        if (userId) {
          if (exists) deleteSavedVerse(userId, verse.ref);
          else upsertSavedVerse(userId, verse);
        }
        return exists ? prev.filter((v) => v.ref !== verse.ref) : [verse, ...prev];
      });
    },
    [userId]
  );

  const registerAiMessage = useCallback(() => {
    setAiMessagesUsed((n) => n + 1);
    if (userId) incrementAiUsage();
  }, [userId]);

  const aiMessagesRemaining = isPro
    ? Infinity
    : Math.max(0, FREE_AI_TRIAL_LIMIT - aiMessagesUsed);

  return (
    <UserContext.Provider
      value={{
        name,
        setName,
        faith,
        setFaith,
        plan,
        isPro,
        setPlan,
        refreshSubscription,
        notificationsEnabled,
        setNotificationsEnabled,
        reminderSound,
        setReminderSound,
        dailyVerseEnabled,
        setDailyVerseEnabled,
        savedVerses,
        isVerseSaved,
        toggleSavedVerse,
        aiMessagesUsed,
        aiMessagesRemaining,
        registerAiMessage,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
};
