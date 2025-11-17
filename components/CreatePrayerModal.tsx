import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, ScrollView } from 'react-native';
import { FAITH_TRADITIONS } from '../constants/faithData';

interface CreatePrayerModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function CreatePrayerModal({ visible, onClose, onSubmit }: CreatePrayerModalProps) {
  const [topic, setTopic] = useState('');
  const [faith, setFaith] = useState('');
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = () => {
    if (topic && faith && time && date) {
      onSubmit({ topic, faith, reminderTime: time, date, status: 'pending' });
      setTopic('');
      setFaith('');
      setTime('');
      setDate('');
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Create Prayer Request</Text>
          <ScrollView>
            <TextInput style={styles.input} placeholder="Prayer topic..." value={topic} onChangeText={setTopic} />
            <Text style={styles.label}>Select Faith Tradition:</Text>
            <View style={styles.faithGrid}>
              {FAITH_TRADITIONS.map(f => (
                <TouchableOpacity key={f.id} onPress={() => setFaith(f.id)} style={[styles.faithBtn, faith === f.id && { backgroundColor: f.color }]}>
                  <Text style={[styles.faithText, faith === f.id && { color: '#fff' }]}>{f.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
            <TextInput style={styles.input} placeholder="Time (HH:MM)" value={time} onChangeText={setTime} />
            <View style={styles.actions}>
              <TouchableOpacity onPress={handleSubmit} style={styles.submitBtn}>
                <Text style={styles.submitText}>Create</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: '#fff', borderRadius: 16, padding: 20, maxHeight: '80%' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16, color: '#1a1a1a' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 15 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333' },
  faithGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  faithBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f0f0f0' },
  faithText: { fontSize: 12, fontWeight: '600', color: '#333' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  submitBtn: { flex: 1, backgroundColor: '#4169E1', padding: 14, borderRadius: 8, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  cancelBtn: { flex: 1, backgroundColor: '#f0f0f0', padding: 14, borderRadius: 8, alignItems: 'center' },
  cancelText: { color: '#333', fontSize: 15, fontWeight: '600' },
});
