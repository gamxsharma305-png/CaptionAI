import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CaptionStyle } from '../models';
import { CAPTION_STYLES } from '../styles/captionStyles';

const KEY = '@captionai:custom-styles';

/** User-created / reel styles, persisted locally. */
export async function listCustomStyles(): Promise<CaptionStyle[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CaptionStyle[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveCustomStyle(style: CaptionStyle): Promise<void> {
  const all = await listCustomStyles();
  const idx = all.findIndex((s) => s.id === style.id);
  if (idx >= 0) all[idx] = style;
  else all.unshift(style);
  await AsyncStorage.setItem(KEY, JSON.stringify(all));
}

export async function deleteCustomStyle(id: string): Promise<void> {
  const all = await listCustomStyles();
  await AsyncStorage.setItem(KEY, JSON.stringify(all.filter((s) => s.id !== id)));
}

/** Custom styles first, then the 12 built-in premium styles. */
export function getAllStyles(custom: CaptionStyle[]): CaptionStyle[] {
  return [...custom, ...CAPTION_STYLES];
}

export function findStyle(id: string, custom: CaptionStyle[]): CaptionStyle {
  return (
    custom.find((s) => s.id === id) ??
    CAPTION_STYLES.find((s) => s.id === id) ??
    CAPTION_STYLES[0]
  );
}

export function isCustomStyle(id: string, custom: CaptionStyle[]): boolean {
  return custom.some((s) => s.id === id);
}

export function newCustomStyleId(): string {
  return `custom-${Date.now().toString(36)}`;
}
