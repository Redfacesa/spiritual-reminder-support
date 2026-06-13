import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { PlanId, FREE_AI_DAILY_LIMIT } from '../constants/subscription';
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
  fetchAiMessagesToday,
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

  aiMessagesToday: number;
  aiMessagesRemaining: number;
  registerAiMessage: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { userId } = useAuth();
  const [name, setNameState] = useState('Manace');
  const [faith, setFaithState] = useState('christianity');
  const [plan, setPlanState] = useState<PlanId>('free');
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);
  const [reminderSound, setReminderSoundState] = useState(true);
  const [dailyVerseEnabled, setDailyVerseEnabledState] = useState(true);
  const [savedVerses, setSavedVerses] = useState<SavedVerse[]>([]);
  const [aiMessagesToday, setAiMessagesToday] = useState(0);

  const isPro = plan === 'pro';

  // Hydrate from Supabase when a user signs in.
  useEffect(() => {
    let cancelled = false;
    if (!userId) return;
    (async () => {
      const [profile, settings, planId, verses, aiToday] = await Promise.all([
        fetchProfile(userId),
        fetchSettings(userId),
        fetchPlan(userId),
        fetchSavedVerses(),
        fetchAiMessagesToday(userId),
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
      setAiMessagesToday(aiToday);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

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
    setAiMessagesToday((n) => n + 1);
    if (userId) incrementAiUsage();
  }, [userId]);

  const aiMessagesRemaining = isPro
    ? Infinity
    : Math.max(0, FREE_AI_DAILY_LIMIT - aiMessagesToday);

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
        aiMessagesToday,
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
