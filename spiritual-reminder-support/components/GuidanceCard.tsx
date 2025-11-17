import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface GuidanceCardProps {
  topic: string;
  faith: string;
  verses: Array<{ ref: string; text: string }>;
  explanation: string;
  prayer: string;
}

export default function GuidanceCard({ topic, faith, verses, explanation, prayer }: GuidanceCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.topic}>Topic: {topic}</Text>
        <Text style={styles.faith}>{faith}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sacred Texts:</Text>
        {verses.map((verse, index) => (
          <View key={index} style={styles.verse}>
            <Text style={styles.verseRef}>{verse.ref}</Text>
            <Text style={styles.verseText}>{verse.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Explanation:</Text>
        <Text style={styles.text}>{explanation}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prayer/Meditation:</Text>
        <Text style={styles.prayerText}>{prayer}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  header: { marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e5e5e5', paddingBottom: 12 },
  topic: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  faith: { fontSize: 13, color: '#4169E1', fontWeight: '600' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 8 },
  verse: { marginBottom: 12, paddingLeft: 12, borderLeftWidth: 3, borderLeftColor: '#4169E1' },
  verseRef: { fontSize: 13, fontWeight: '600', color: '#4169E1', marginBottom: 4 },
  verseText: { fontSize: 14, lineHeight: 20, color: '#555', fontStyle: 'italic' },
  text: { fontSize: 14, lineHeight: 22, color: '#555' },
  prayerText: { fontSize: 14, lineHeight: 22, color: '#333', fontStyle: 'italic', backgroundColor: '#f8f9fa', padding: 12, borderRadius: 8 },
});
