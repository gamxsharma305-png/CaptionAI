import type { TextStyle } from 'react-native';
import type { AppFontFamily } from './fonts';

// A single word with its timing (seconds).
export interface CaptionWord {
  id: string;
  text: string;
  start: number;
  end: number;
}

export type MediaType = 'video' | 'audio';

export interface MediaFile {
  path: string;
  name: string;
  type: MediaType;
  durationSeconds?: number;
}

export type CaptionAnimation =
  | 'karaoke'
  | 'pop'
  | 'typewriter'
  | 'bounce'
  | 'glow-pulse'
  | 'fade-up'
  | 'scale-punch'
  | 'word-highlight'
  | 'slide-in'
  | 'neon-flicker'
  | 'minimal'
  | 'outline';

export interface CaptionBackground {
  type: 'none' | 'pill' | 'box';
  color: string;
  radius: number;
  padding: number;
}

export interface CaptionStyle {
  id: string;
  name: string;
  tagline: string;
  fontFamily: AppFontFamily;
  fontSize: number;
  fontWeight: TextStyle['fontWeight'];
  textColor: string;
  highlightColor: string;
  background: CaptionBackground;
  stroke?: { color: string; width: number };
  glow?: { color: string; radius: number };
  animation: CaptionAnimation;
  uppercase?: boolean;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  mediaPath?: string;
  mediaType?: MediaType;
  words: CaptionWord[];
  styleId: string;
  language: string;
}
