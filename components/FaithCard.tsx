import React from 'react';
import { Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, shadow } from '../constants/theme';

interface FaithCardProps {
  name: string;
  image: string;
  color: string;
  onPress: () => void;
}

export default function FaithCard({ name, image, color, onPress }: FaithCardProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.card} activeOpacity={0.85}>
      <Image source={{ uri: image }} style={[styles.image, { backgroundColor: color + '22' }]} />
      <Text style={styles.name} numberOfLines={1}>{name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    marginBottom: 12,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...shadow.soft,
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: 'contain',
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
});
