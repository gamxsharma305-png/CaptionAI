import type { CaptionWord } from '../models';
import { getKeys } from './keys';

export interface TranscriptionService {
  transcribe(mediaPath: string, language?: string): Promise<CaptionWord[]>;
}

/** Languages supported by Groq Whisper. 'auto' lets the model detect. */
export const TRANSCRIPTION_LANGUAGES = [
  { code: 'auto', label: 'Auto' },
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'it', label: 'Italian' },
  { code: 'ru', label: 'Russian' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ar', label: 'Arabic' },
] as const;

// ---------------------------------------------------------------------------
// Mock implementation: ~30s of realistic word-level timestamps with a 2s
// simulated delay, so the full UI flow works without an API key.
// ---------------------------------------------------------------------------
const DEMO_SCRIPT =
  'Welcome to CaptionAI where your words become stunning kinetic typography in seconds. ' +
  'Import any video and watch every word light up in perfect sync with premium pro styles.';

export class MockTranscriptionService implements TranscriptionService {
  async transcribe(_mediaPath: string, _language = 'en'): Promise<CaptionWord[]> {
    await new Promise((r) => setTimeout(r, 2000));
    const tokens = DEMO_SCRIPT.split(' ');
    const perWord = 0.68;
    const gap = 0.04;
    let t = 0.4;
    return tokens.map((text, i) => {
      const start = t;
      const end = t + perWord;
      t = end + gap;
      return { id: `w${i}`, text, start, end };
    });
  }
}

// ---------------------------------------------------------------------------
// Groq Whisper transcription (free tier).
//
// Uses the Groq OpenAI-compatible audio endpoint with the
// whisper-large-v3-turbo model and word-level timestamp granularities.
// The API key is entered by the user on the Setup screen and stored in
// expo-secure-store — it is NEVER hardcoded in source.
// Get a free key at https://console.groq.com/keys
// ---------------------------------------------------------------------------
interface GroqWord {
  word: string;
  start: number;
  end: number;
}

interface GroqVerboseResponse {
  words?: GroqWord[];
  text?: string;
}

export class GroqTranscriptionService implements TranscriptionService {
  static async isConfigured(): Promise<boolean> {
    const { groq } = await getKeys();
    return !!groq;
  }

  async transcribe(mediaPath: string, language = 'auto'): Promise<CaptionWord[]> {
    const { groq } = await getKeys();
    if (!groq) {
      throw new Error('Groq API key missing. Add it from the API Keys screen (gear icon on Home).');
    }

    const ext = (mediaPath.split('.').pop() ?? '').toLowerCase();
    const isVideo = ['mp4', 'mov', 'mkv', 'webm', '3gp'].includes(ext);

    const form = new FormData();
    form.append('file', {
      uri: mediaPath,
      name: `audio.${isVideo ? 'mp4' : 'm4a'}`,
      type: isVideo ? 'video/mp4' : 'audio/m4a',
    } as unknown as Blob);
    form.append('model', 'whisper-large-v3-turbo');
    form.append('response_format', 'verbose_json');
    form.append('timestamp_granularities[]', 'word');
    if (language !== 'auto') {
      form.append('language', language);
    }

    let res: Response;
    try {
      res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${groq}` },
        body: form,
      });
    } catch {
      throw new Error('Network error talking to Groq — check your connection and retry.');
    }
    if (!res.ok) {
      const body = await res.text();
      if (res.status === 401 || res.status === 403) {
        throw new Error('Groq rejected the API key. Re-check it on the API Keys screen.');
      }
      throw new Error(`Groq transcription failed (${res.status}): ${body.slice(0, 160)}`);
    }
    const json = (await res.json()) as GroqVerboseResponse;
    const raw = json.words ?? [];
    if (raw.length === 0) {
      throw new Error('Groq returned no word timestamps. Try a different file.');
    }
    return raw.map((w, i) => ({
      id: `w${i}`,
      text: w.word,
      start: w.start,
      end: w.end,
    }));
  }
}
