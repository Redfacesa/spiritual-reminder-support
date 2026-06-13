import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useUser } from './UserContext';
import {
  fetchPrayers,
  insertPrayer,
  updatePrayerStatusRemote,
  deletePrayerRemote,
} from '../lib/repositories';
import { schedulePrayerReminder, cancelNotification } from '../utils/notificationHelper';

export type PrayerStatus = 'active' | 'completed' | 'answered' | 'archived';

export interface Prayer {
  id: string;
  topic: string;
  faith: string;
  reminderTime: string;
  date: string;
  status: PrayerStatus;
  recurring?: boolean;
  createdAt: string; // ISO date
}

interface PrayerContextType {
  prayers: Prayer[];
  addPrayer: (prayer: Omit<Prayer, 'id' | 'createdAt'> & { createdAt?: string }) => void;
  updatePrayerStatus: (id: string, status: PrayerStatus) => void;
  deletePrayer: (id: string) => void;
  streak: number;
  activeCount: number;
}

const PrayerContext = createContext<PrayerContextType | undefined>(undefined);

const todayISO = () => new Date().toISOString().split('T')[0];

const seed = (): Prayer[] => [
  { id: '1', topic: 'Business Growth', faith: 'christianity', reminderTime: '18:00', date: todayISO(), status: 'active', recurring: true, createdAt: '2025-06-01' },
  { id: '2', topic: 'Family Harmony', faith: 'islam', reminderTime: '12:00', date: todayISO(), status: 'active', recurring: true, createdAt: '2025-06-02' },
  { id: '3', topic: 'Health and Healing', faith: 'judaism', reminderTime: '09:00', date: todayISO(), status: 'active', createdAt: '2025-06-03' },
  { id: '4', topic: 'Career Guidance', faith: 'christianity', reminderTime: '07:00', date: '2025-06-05', status: 'answered', createdAt: '2025-05-20' },
  { id: '5', topic: 'Inner Peace', faith: 'buddhism', reminderTime: '06:00', date: todayISO(), status: 'active', recurring: true, createdAt: '2025-06-04' },
  { id: '6', topic: 'Wisdom and Clarity', faith: 'hinduism', reminderTime: '05:30', date: '2025-06-06', status: 'completed', createdAt: '2025-06-01' },
  { id: '7', topic: 'Gratitude Practice', faith: 'general', reminderTime: '20:00', date: todayISO(), status: 'active', recurring: true, createdAt: '2025-06-05' },
  { id: '8', topic: 'Relationship Healing', faith: 'christianity', reminderTime: '19:00', date: '2025-06-04', status: 'archived', createdAt: '2025-05-15' },
];

// A simple streak: count of consecutive days (ending today) that have at least
// one completed/answered prayer logged. With seed data this is illustrative.
function computeStreak(prayers: Prayer[]): number {
  const doneDates = new Set(
    prayers.filter((p) => p.status === 'completed' || p.status === 'answered').map((p) => p.date)
  );
  let streak = 0;
  const cursor = new Date();
  // Allow up to a 1-year look-back.
  for (let i = 0; i < 365; i++) {
    const iso = cursor.toISOString().split('T')[0];
    if (doneDates.has(iso)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else if (i === 0) {
      // No completion today yet — keep a friendly baseline streak of 7 for demo.
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak || 7;
}

// Maps a prayer id -> scheduled notification id so we can cancel it later.
const notifIds = new Map<string, string>();

export const PrayerProvider = ({ children }: { children: ReactNode }) => {
  const { userId } = useAuth();
  const { notificationsEnabled, reminderSound } = useUser();
  const [prayers, setPrayers] = useState<Prayer[]>(seed());

  // When the signed-in user changes, load their cloud prayers. Signing out
  // falls back to the local demo data.
  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setPrayers(seed());
      return;
    }
    fetchPrayers().then((remote) => {
      if (!cancelled) setPrayers(remote);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const addPrayer: PrayerContextType['addPrayer'] = (prayer) => {
    const next: Prayer = {
      ...prayer,
      id: Date.now().toString(),
      createdAt: prayer.createdAt ?? todayISO(),
    };
    if (userId) {
      // Insert remotely and swap the temporary row for the persisted one.
      insertPrayer(userId, next).then((saved) => {
        if (saved) {
          setPrayers((prev) => prev.map((p) => (p.id === next.id ? saved : p)));
          // Move any scheduled notification to the persisted id.
          const existing = notifIds.get(next.id);
          if (existing) {
            notifIds.set(saved.id, existing);
            notifIds.delete(next.id);
          }
        }
      });
    }
    setPrayers((prev) => [...prev, next]);

    if (notificationsEnabled && next.reminderTime) {
      schedulePrayerReminder({
        topic: next.topic,
        time: next.reminderTime,
        date: next.date,
        recurring: next.recurring,
        sound: reminderSound,
      }).then((id) => {
        if (id) notifIds.set(next.id, id);
      });
    }
  };

  const updatePrayerStatus = (id: string, status: PrayerStatus) => {
    setPrayers((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    if (userId) updatePrayerStatusRemote(id, status);
  };

  const deletePrayer = (id: string) => {
    setPrayers((prev) => prev.filter((p) => p.id !== id));
    if (userId) deletePrayerRemote(id);
    const notifId = notifIds.get(id);
    if (notifId) {
      cancelNotification(notifId);
      notifIds.delete(id);
    }
  };

  const streak = useMemo(() => computeStreak(prayers), [prayers]);
  const activeCount = useMemo(() => prayers.filter((p) => p.status === 'active').length, [prayers]);

  return (
    <PrayerContext.Provider value={{ prayers, addPrayer, updatePrayerStatus, deletePrayer, streak, activeCount }}>
      {children}
    </PrayerContext.Provider>
  );
};

export const usePrayers = () => {
  const context = useContext(PrayerContext);
  if (!context) throw new Error('usePrayers must be used within PrayerProvider');
  return context;
};
