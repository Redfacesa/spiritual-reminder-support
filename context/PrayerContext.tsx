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

// Real streak: number of consecutive days (ending today) that have at least one
// completed/answered prayer. A not-yet-completed today does not break the streak.
function computeStreak(prayers: Prayer[]): number {
  const doneDates = new Set(
    prayers.filter((p) => p.status === 'completed' || p.status === 'answered').map((p) => p.date)
  );
  if (doneDates.size === 0) return 0;
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 365; i++) {
    const iso = cursor.toISOString().split('T')[0];
    if (doneDates.has(iso)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else if (i === 0) {
      // Nothing completed today yet — look at yesterday before breaking.
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// Maps a prayer id -> scheduled notification id so we can cancel it later.
const notifIds = new Map<string, string>();

export const PrayerProvider = ({ children }: { children: ReactNode }) => {
  const { userId } = useAuth();
  const { notificationsEnabled, reminderSound } = useUser();
  const [prayers, setPrayers] = useState<Prayer[]>([]);

  // Load the signed-in user's cloud prayers. Signing out clears everything.
  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setPrayers([]);
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
