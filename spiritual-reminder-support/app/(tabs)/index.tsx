import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ImageBackground, TouchableOpacity, StyleSheet } from 'react-native';
import { usePrayers } from '../../context/PrayerContext';
import FaithCard from '../../components/FaithCard';
import CreatePrayerModal from '../../components/CreatePrayerModal';
import DailyVerse from '../../components/DailyVerse';
import { FAITH_TRADITIONS } from '../../constants/faithData';

import { openDatabase, initializeDb } from '../../db'; // your SQLite DB file
import type * as SQLite from 'expo-sqlite';

export default function HomeScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFaith, setSelectedFaith] = useState('');
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [prayers, setPrayers] = useState<any[]>([]);

  // Open DB and initialize tables
  useEffect(() => {
    async function setupDb() {
      const database = await openDatabase();
      await initializeDb(database);
      setDb(database);
      await loadPrayers(database);
    }
    setupDb();
  }, []);

  // Load prayers from DB
  const loadPrayers = async (database: SQLite.SQLiteDatabase) => {
    const result = await database.execAsync(`SELECT * FROM prayers ORDER BY createdAt DESC;`);
    // execAsync returns an array of results; each has rows._array
    /*if (result.length > 0) {
      setPrayers(result[0].rows._array);
    }*/
  };

  // Add a prayer to DB
  const addPrayer = async (faith: string, title: string, content: string) => {
    if (!db) return;

    const createdAt = new Date().toISOString();
    await db.execAsync(
      `INSERT INTO prayers (faith, title, content, createdAt) VALUES (?, ?, ?, ?);`,
      [faith, title, content, createdAt]
    );

    await loadPrayers(db); // refresh local state
  };

  const handleFaithSelect = (faithId: string) => {
    setSelectedFaith(faithId);
    setModalVisible(true);
  };
  /** */
  return (
    <ScrollView style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://d64gsuwffb70l.cloudfront.net/690b10b0a8e008747ffb2180_1762332898403_26650223.webp' }}
        style={styles.hero}
      >
        <View style={styles.heroOverlay}>
          <Text style={styles.heroTitle}>Your Multi-Faith</Text>
          <Text style={styles.heroTitle}>Spiritual Companion</Text>
          <Text style={styles.heroSubtitle}>Prayer reminders, sacred texts, and guidance for all beliefs</Text>
        </View>
      </ImageBackground>

      <DailyVerse />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Create Prayer Request</Text>
        <Text style={styles.sectionSubtitle}>Select your faith tradition to begin</Text>
        <View style={styles.faithGrid}>
          {FAITH_TRADITIONS.map(faith => (
            <FaithCard
              key={faith.id}
              name={faith.name}
              image={faith.image}
              color={faith.color}
              onPress={() => handleFaithSelect(faith.id)}
            />
          ))}
        </View>
      </View>

      <CreatePrayerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={addPrayer}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  hero: { height: 280, justifyContent: 'center' },
  heroOverlay: { backgroundColor: 'rgba(25, 25, 112, 0.7)', flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  heroTitle: { fontSize: 32, fontWeight: '700', color: '#fff', textAlign: 'center' },
  heroSubtitle: { fontSize: 16, color: '#e0e0e0', textAlign: 'center', marginTop: 12 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  sectionSubtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
  faithGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
});
