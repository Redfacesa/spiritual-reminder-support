import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Prayer {
  id: string;
  topic: string;
  faith: string;
  reminderTime: string;
  date: string;
  status: 'pending' | 'completed';
  recurring?: boolean;
}

interface PrayerContextType {
  prayers: Prayer[];
  addPrayer: (prayer: Omit<Prayer, 'id'>) => void;
  updatePrayerStatus: (id: string, status: 'pending' | 'completed') => void;
  deletePrayer: (id: string) => void;
}

const PrayerContext = createContext<PrayerContextType | undefined>(undefined);

export const PrayerProvider = ({ children }: { children: ReactNode }) => {
  const [prayers, setPrayers] = useState<Prayer[]>([
    { id: '1', topic: 'Financial breakthrough', faith: 'christianity', reminderTime: '18:00', date: '2025-11-05', status: 'pending' },
    { id: '2', topic: 'Family harmony', faith: 'islam', reminderTime: '12:00', date: '2025-11-05', status: 'pending', recurring: true },
    { id: '3', topic: 'Health and healing', faith: 'judaism', reminderTime: '09:00', date: '2025-11-06', status: 'pending' },
    { id: '4', topic: 'Career guidance', faith: 'christianity', reminderTime: '07:00', date: '2025-11-06', status: 'completed' },
    { id: '5', topic: 'Inner peace', faith: 'buddhism', reminderTime: '06:00', date: '2025-11-07', status: 'pending', recurring: true },
    { id: '6', topic: 'Wisdom and clarity', faith: 'hinduism', reminderTime: '05:30', date: '2025-11-07', status: 'pending' },
    { id: '7', topic: 'Gratitude practice', faith: 'general', reminderTime: '20:00', date: '2025-11-08', status: 'pending', recurring: true },
    { id: '8', topic: 'Relationship healing', faith: 'christianity', reminderTime: '19:00', date: '2025-11-08', status: 'completed' },
    { id: '9', topic: 'Protection and safety', faith: 'islam', reminderTime: '21:00', date: '2025-11-09', status: 'pending' },
    { id: '10', topic: 'Spiritual growth', faith: 'general', reminderTime: '06:30', date: '2025-11-09', status: 'pending' },
  ]);

  const addPrayer = (prayer: Omit<Prayer, 'id'>) => {
    setPrayers([...prayers, { ...prayer, id: Date.now().toString() }]);
  };


  const updatePrayerStatus = (id: string, status: 'pending' | 'completed') => {
    setPrayers(prayers.map(p => p.id === id ? { ...p, status } : p));
  };

  const deletePrayer = (id: string) => {
    setPrayers(prayers.filter(p => p.id !== id));
  };

  return (
    <PrayerContext.Provider value={{ prayers, addPrayer, updatePrayerStatus, deletePrayer }}>
      {children}
    </PrayerContext.Provider>
  );
};

export const usePrayers = () => {
  const context = useContext(PrayerContext);
  if (!context) throw new Error('usePrayers must be used within PrayerProvider');
  return context;
};
