import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SACRED_TEXTS } from '../constants/sacredTexts';

export default function DailyVerse() {
  // Get a random verse from all traditions
  const allTexts = Object.values(SACRED_TEXTS).flat();
  const randomVerse = allTexts[Math.floor(Math.random() * allTexts.length)];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Daily Inspiration</Text>
      <View style={styles.card}>
        <Text style={styles.reference}>{randomVerse.ref}</Text>
        <Text style={styles.text}>{randomVerse.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#9370DB',
  },
  reference: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4169E1',
    marginBottom: 8,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    fontStyle: 'italic',
  },
});
