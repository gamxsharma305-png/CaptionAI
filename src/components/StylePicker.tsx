import React from 'react';
import { FlatList, Pressable, StyleSheet, Text } from 'react-native';
import type { CaptionStyle, CaptionWord } from '../models';
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
  /** Extra styles (custom / reel) shown before the built-ins. */
  extraStyles?: CaptionStyle[];
  /** Called on long-press — used to open the custom style editor. */
  onEditStyle?: (id: string) => void;
}

export function StylePicker({ selectedId, onSelect, extraStyles = [], onEditStyle }: StylePickerProps) {
  const styles = [...extraStyles, ...CAPTION_STYLES];
  return (
    <FlatList
      data={styles}
      numColumns={2}
      keyExtractor={(s) => s.id}
      scrollEnabled={false}
      columnWrapperStyle={listStyles.row}
      renderItem={({ item }) => {
        const selected = item.id === selectedId;
        const isCustom = extraStyles.some((s) => s.id === item.id);
        return (
          <Pressable
            onPress={() => onSelect(item.id)}
            onLongPress={onEditStyle ? () => onEditStyle(item.id) : undefined}
            delayLongPress={450}
            style={[listStyles.card, selected && listStyles.cardSelected]}>
            <KineticPreview words={SAMPLE_WORDS} style={item} fontScale={0.42} durationMs={4000} />
            <Text style={listStyles.name}>
              {item.name}
              {isCustom ? ' ✎' : ''}
            </Text>
            <Text style={listStyles.tagline} numberOfLines={1}>
              {item.tagline}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}

const listStyles = StyleSheet.create({
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
