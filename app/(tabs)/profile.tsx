import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { usePrayers } from '../../context/PrayerContext';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { prayers } = usePrayers();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  const completedCount = prayers.filter(p => p.status === 'completed').length;
  const pendingCount = prayers.filter(p => p.status === 'pending').length;

  const handleToggleNotifications = (value: boolean) => {
    setNotificationsEnabled(value);
    Alert.alert('Notifications', value ? 'Notifications enabled' : 'Notifications disabled');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={48} color="#4169E1" />
        </View>
        <Text style={styles.name}>Spiritual Seeker</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{prayers.length}</Text>
          <Text style={styles.statLabel}>Total Prayers</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{completedCount}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Prayer Reminders</Text>
          <Switch value={notificationsEnabled} onValueChange={handleToggleNotifications} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { alignItems: 'center', padding: 32, backgroundColor: '#fff' },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#e8f0fe', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  name: { fontSize: 20, fontWeight: '700', color: '#1a1a1a' },
  stats: { flexDirection: 'row', padding: 20, gap: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '700', color: '#4169E1' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 },
  setting: { backgroundColor: '#fff', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingLabel: { fontSize: 15, color: '#333' },
});
