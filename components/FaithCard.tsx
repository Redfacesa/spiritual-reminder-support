import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

interface FaithCardProps {
  name: string;
  image: string;
  color: string;
  onPress: () => void;
}

export default function FaithCard({ name, image, color, onPress }: FaithCardProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      <View style={[styles.imageContainer, { backgroundColor: color + '20' }]}>
        <Image source={{ uri: image }} style={styles.image} />
      </View>
      <Text style={styles.name}>{name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  image: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
});
