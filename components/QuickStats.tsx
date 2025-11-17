import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePrayers } from '../context/PrayerContext';

export default function QuickStats() {
  const { prayers } = usePrayers();
  
  const totalPrayers = prayers.length;
  const completedToday = prayers.filter(p => 
    p.status === 'completed' && p.date === new Date().toISOString().split('T')[0]
  ).length;
  const pendingToday = prayers.filter(p => 
    p.status === 'pending' && p.date === new Date().toISOString().split('T')[0]
  ).length;

  return (
    <View style={styles.container}>
      <View style={styles.statBox}>
        <Text style={styles.value}>{totalPrayers}</Text>
        <Text style={styles.label}>Total</Text>
      </View>
      <View style={styles.statBox}>
        <Text style={styles.value}>{pendingToday}</Text>
        <Text style={styles.label}>Today</Text>
      </View>
      <View style={styles.statBox}>
        <Text style={styles.value}>{completedToday}</Text>
        <Text style={styles.label}>Done</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4169E1',
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
