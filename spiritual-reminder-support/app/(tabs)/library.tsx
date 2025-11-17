import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { FAITH_TRADITIONS } from '../../constants/faithData';
import { SACRED_TEXTS } from '../../constants/sacredTexts';

export default function LibraryScreen() {
  const [selectedFaith, setSelectedFaith] = useState('christianity');
  const texts = SACRED_TEXTS[selectedFaith] || [];

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {FAITH_TRADITIONS.map(faith => (
          <TouchableOpacity
            key={faith.id}
            onPress={() => setSelectedFaith(faith.id)}
            style={[styles.tab, selectedFaith === faith.id && { backgroundColor: faith.color }]}
          >
            <Text style={[styles.tabText, selectedFaith === faith.id && { color: '#fff' }]}>{faith.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content}>
        <Text style={styles.title}>Sacred Texts & Teachings</Text>
        {texts.map((text, index) => (
          <View key={index} style={styles.textCard}>
            <Text style={styles.reference}>{text.ref}</Text>
            <Text style={styles.text}>{text.text}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  tabs: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e5e5', paddingVertical: 12, paddingHorizontal: 16 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 8 },
  tabText: { fontSize: 13, fontWeight: '600', color: '#333' },
  content: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 16 },
  textCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  reference: { fontSize: 14, fontWeight: '700', color: '#4169E1', marginBottom: 8 },
  text: { fontSize: 15, lineHeight: 22, color: '#333' },
});
