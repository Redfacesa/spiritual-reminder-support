import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { getJSON, setJSON } from '../lib/storage';
import { READING_PLANS } from '../constants/readingPlans';

// progress[planId] = sorted array of completed day numbers
export type PlanProgress = Record<string, number[]>;

interface ReadingPlanContextType {
  progress: PlanProgress;
  isDayComplete: (planId: string, day: number) => boolean;
  completedCount: (planId: string) => number;
  toggleDay: (planId: string, day: number) => void;
  resetPlan: (planId: string) => void;
  isStarted: (planId: string) => boolean;
  currentDay: (planId: string) => number;
}

const STORAGE_KEY = 'support.readingPlans.v1';
const ReadingPlanContext = createContext<ReadingPlanContextType | undefined>(undefined);

export const ReadingPlanProvider = ({ children }: { children: ReactNode }) => {
  const [progress, setProgress] = useState<PlanProgress>({});

  useEffect(() => {
    let cancelled = false;
    getJSON<PlanProgress>(STORAGE_KEY, {}).then((saved) => {
      if (!cancelled) setProgress(saved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: PlanProgress) => {
    setProgress(next);
    setJSON(STORAGE_KEY, next);
  }, []);

  const isDayComplete = useCallback(
    (planId: string, day: number) => (progress[planId] ?? []).includes(day),
    [progress]
  );

  const completedCount = useCallback((planId: string) => (progress[planId] ?? []).length, [progress]);

  const isStarted = useCallback((planId: string) => (progress[planId] ?? []).length > 0, [progress]);

  // The first not-yet-completed day (1-indexed), capped at plan length.
  const currentDay = useCallback(
    (planId: string) => {
      const plan = READING_PLANS.find((p) => p.id === planId);
      const len = plan?.length ?? 0;
      const done = progress[planId] ?? [];
      for (let d = 1; d <= len; d++) {
        if (!done.includes(d)) return d;
      }
      return len;
    },
    [progress]
  );

  const toggleDay = useCallback(
    (planId: string, day: number) => {
      const current = progress[planId] ?? [];
      const next = current.includes(day)
        ? current.filter((d) => d !== day)
        : [...current, day].sort((a, b) => a - b);
      persist({ ...progress, [planId]: next });
    },
    [progress, persist]
  );

  const resetPlan = useCallback(
    (planId: string) => {
      const next = { ...progress };
      delete next[planId];
      persist(next);
    },
    [progress, persist]
  );

  return (
    <ReadingPlanContext.Provider
      value={{ progress, isDayComplete, completedCount, toggleDay, resetPlan, isStarted, currentDay }}
    >
      {children}
    </ReadingPlanContext.Provider>
  );
};

export const useReadingPlans = () => {
  const ctx = useContext(ReadingPlanContext);
  if (!ctx) throw new Error('useReadingPlans must be used within ReadingPlanProvider');
  return ctx;
};
