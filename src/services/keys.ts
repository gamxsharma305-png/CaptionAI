import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const GROQ_KEY_REF = 'captionai_groq_key';
const GEMINI_KEY_REF = 'captionai_gemini_key';
const ONBOARDED_KEY = '@captionai:onboarded';

export type KeyStatus = 'idle' | 'checking' | 'valid' | 'invalid';

export interface KeyCheckResult {
  ok: boolean;
  message: string;
}

/**
 * Verify a Groq API key by hitting the Groq OpenAI-compatible models
 * endpoint. HTTP 200 = the key is real and active.
 */
export async function verifyGroqKey(key: string): Promise<KeyCheckResult> {
  const trimmed = key.trim();
  if (!trimmed) return { ok: false, message: 'Enter your Groq API key first.' };
  let res: Response;
  try {
    res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });
  } catch {
    return { ok: false, message: 'Network error — check your connection and retry.' };
  }
  if (res.ok) return { ok: true, message: 'Groq key verified.' };
  if (res.status === 401 || res.status === 403) {
    return { ok: false, message: 'Invalid Groq key — it was rejected by Groq.' };
  }
  return { ok: false, message: `Groq check failed (HTTP ${res.status}). Try again.` };
}

/**
 * Verify a Gemini API key via the Generative Language models endpoint.
 * HTTP 200 = the key is real and active.
 */
export async function verifyGeminiKey(key: string): Promise<KeyCheckResult> {
  const trimmed = key.trim();
  if (!trimmed) return { ok: false, message: 'Enter your Gemini API key first.' };
  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(trimmed)}`,
    );
  } catch {
    return { ok: false, message: 'Network error — check your connection and retry.' };
  }
  if (res.ok) return { ok: true, message: 'Gemini key verified.' };
  if (res.status === 400 || res.status === 403) {
    return { ok: false, message: 'Invalid Gemini key — it was rejected by Google.' };
  }
  return { ok: false, message: `Gemini check failed (HTTP ${res.status}). Try again.` };
}

export interface ApiKeys {
  groq: string | null;
  gemini: string | null;
}

export async function saveKeys(groq: string, gemini?: string | null): Promise<void> {
  await SecureStore.setItemAsync(GROQ_KEY_REF, groq.trim());
  if (gemini && gemini.trim()) {
    await SecureStore.setItemAsync(GEMINI_KEY_REF, gemini.trim());
  } else {
    await SecureStore.deleteItemAsync(GEMINI_KEY_REF);
  }
}

export async function getKeys(): Promise<ApiKeys> {
  const [groq, gemini] = await Promise.all([
    SecureStore.getItemAsync(GROQ_KEY_REF),
    SecureStore.getItemAsync(GEMINI_KEY_REF),
  ]);
  return { groq, gemini };
}

export async function hasGroqKey(): Promise<boolean> {
  const { groq } = await getKeys();
  return !!groq;
}

export async function clearKeys(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(GROQ_KEY_REF),
    SecureStore.deleteItemAsync(GEMINI_KEY_REF),
  ]);
}

export async function isOnboarded(): Promise<boolean> {
  return (await AsyncStorage.getItem(ONBOARDED_KEY)) === '1';
}

export async function setOnboarded(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDED_KEY, '1');
}

export async function clearOnboarded(): Promise<void> {
  await AsyncStorage.removeItem(ONBOARDED_KEY);
}
