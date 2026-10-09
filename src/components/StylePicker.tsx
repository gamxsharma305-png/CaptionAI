import React from 'react';
import { FlatList, Pressable, StyleSheet, Text } from 'react-native';
import type { CaptionWord } from '../models';
import { CAPTION_STYLES } from '../styles/captionStyles';
import { theme } from '../theme';
import { KineticPreview } from './KineticPreview';

const SAMPLE_WORDS: CaptionWord[] = [
  { id: 's1', text: 'Premium', start: 0, end: 1 },
  { id: 's2', text: 'captions', start: 1, end: 2 },
  { id: 's3', text: 'made', start: 2, end: 3 },
  { id: 's4', text: 'easy', start: 3, end: 4 },
];

interface StylePickerProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function StylePicker({ selectedId, onSelect }: StylePickerProps) {
  return (
    <FlatList
      data={CAPTION_STYLES}
      numColumns={2}
      keyExtractor={(s) => s.id}
      scrollEnabled={false}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => {
        const selected = item.id === selectedId;
        return (
          <Pressable
            onPress={() => onSelect(item.id)}
            style={[styles.card, selected && styles.cardSelected]}>
            <KineticPreview words={SAMPLE_WORDS} style={item} fontScale={0.42} durationMs={4000} />
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.tagline} numberOfLines={1}>
              {item.tagline}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  card: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: theme.colors.primary,
  },
  name: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    marginTop: theme.spacing.sm,
  },
  tagline: {
    color: theme.colors.muted,
    fontSize: theme.fontSize.xs,
    marginTop: 2,
  },
});
