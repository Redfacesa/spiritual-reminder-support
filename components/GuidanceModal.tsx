import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import GuidanceCard from './GuidanceCard';
import { FAITH_TRADITIONS } from '../constants/faithData';
import { generateGuidance, Guidance } from '../utils/grok';

interface GuidanceModalProps {
  visible: boolean;
  topic: string;
  faith: string; // faith id (e.g. 'christianity')
  onClose: () => void;
}

export default function GuidanceModal({ visible, topic, faith, onClose }: GuidanceModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guidance, setGuidance] = useState<Guidance | null>(null);

  const faithName = FAITH_TRADITIONS.find((f) => f.id === faith)?.name || faith;

  const fetchGuidance = async () => {
    setLoading(true);
    setError(null);
    setGuidance(null);
    try {
      const result = await generateGuidance(topic, faith);
      setGuidance(result);
    } catch (e) {
      setError('Could not generate guidance. Make sure the proxy server is running, then try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && topic) {
      fetchGuidance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, topic, faith]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>AI Spiritual Guidance</Text>
              <Text style={styles.subtitle}>
                {topic} · {faithName}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {loading && (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color="#4169E1" />
                <Text style={styles.loadingText}>Seeking guidance from the scriptures...</Text>
              </View>
            )}

            {!loading && error && (
              <View style={styles.centered}>
                <Ionicons name="cloud-offline-outline" size={40} color="#ccc" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={fetchGuidance}>
                  <Text style={styles.retryText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}

            {!loading && !error && guidance && (
              <GuidanceCard
                topic={guidance.topic}
                faith={guidance.faith}
                verses={guidance.verses}
                explanation={guidance.explanation}
                prayer={guidance.prayer}
              />
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#f8f9fa', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '88%', paddingTop: 8 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#ddd', marginBottom: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerText: { flex: 1 },
  title: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  subtitle: { fontSize: 13, color: '#4169E1', marginTop: 2, fontWeight: '600' },
  body: { paddingHorizontal: 16 },
  bodyContent: { paddingVertical: 16 },
  centered: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 16, fontSize: 14, color: '#666' },
  errorText: { marginTop: 16, fontSize: 14, color: '#666', textAlign: 'center', paddingHorizontal: 20 },
  retryBtn: { marginTop: 20, backgroundColor: '#4169E1', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
