import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Prayer } from '../context/PrayerContext';
import { FAITH_TRADITIONS } from '../constants/faithData';

interface PrayerCardProps {
  prayer: Prayer;
  onStatusToggle: () => void;
  onDelete: () => void;
}

export default function PrayerCard({ prayer, onStatusToggle, onDelete }: PrayerCardProps) {
  const faith = FAITH_TRADITIONS.find(f => f.id === prayer.faith);
  
  return (
    <View style={[styles.card, { borderLeftColor: faith?.color || '#9370DB' }]}>
      <View style={styles.header}>
        <Text style={styles.topic}>{prayer.topic}</Text>
        <Text style={styles.faith}>{faith?.name}</Text>
      </View>
      <View style={styles.details}>
        <Text style={styles.time}>{prayer.date} at {prayer.reminderTime}</Text>
        {prayer.recurring && <Text style={styles.recurring}>Recurring</Text>}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={onStatusToggle} style={[styles.button, prayer.status === 'completed' && styles.completedButton]}>
          <Text style={styles.buttonText}>{prayer.status === 'completed' ? 'Completed' : 'Mark Complete'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  header: { marginBottom: 8 },
  topic: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  faith: { fontSize: 13, color: '#666' },
  details: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  time: { fontSize: 12, color: '#888', marginRight: 8 },
  recurring: { fontSize: 11, color: '#9370DB', fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8 },
  button: { flex: 1, backgroundColor: '#4169E1', padding: 10, borderRadius: 8, alignItems: 'center' },
  completedButton: { backgroundColor: '#22c55e' },
  buttonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  deleteButton: { paddingHorizontal: 16, justifyContent: 'center' },
  deleteText: { color: '#ef4444', fontSize: 13, fontWeight: '600' },
});
