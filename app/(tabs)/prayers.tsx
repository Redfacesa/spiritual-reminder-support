import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { usePrayers } from '../../context/PrayerContext';
import PrayerCard from '../../components/PrayerCard';
import QuickStats from '../../components/QuickStats';
import { Ionicons } from '@expo/vector-icons';


export default function PrayersScreen() {
  const { prayers, updatePrayerStatus, deletePrayer } = usePrayers();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>My Prayer Requests</Text>
          <Text style={styles.subtitle}>{prayers.length} active prayers</Text>
        </View>

        <QuickStats />


        {prayers.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="flower-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No prayers yet</Text>
            <Text style={styles.emptySubtext}>Create your first prayer request from the Home tab</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {prayers.map(prayer => (
              <PrayerCard
                key={prayer.id}
                prayer={prayer}
                onStatusToggle={() => updatePrayerStatus(prayer.id, prayer.status === 'pending' ? 'completed' : 'pending')}
                onDelete={() => deletePrayer(prayer.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollView: { flex: 1 },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e5e5' },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a1a' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  list: { padding: 20 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#999', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#bbb', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
});
