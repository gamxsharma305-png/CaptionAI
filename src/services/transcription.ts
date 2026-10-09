import type { CaptionWord } from '../models';

export interface TranscriptionService {
  transcribe(mediaPath: string, language?: string): Promise<CaptionWord[]>;
}

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
// OpenAI Whisper scaffold.
//
// TODO: create a `.env` file in the project root with:
//     EXPO_PUBLIC_WHISPER_API_KEY=sk-...
// then restart the dev server (`npx expo start -c`). The key is read from
// the public env at build time and is NEVER hardcoded in source.
// For production, proxy through your own backend instead of shipping the
// key in the client.
// ---------------------------------------------------------------------------
const WHISPER_API_KEY = process.env.EXPO_PUBLIC_WHISPER_API_KEY;

export class WhisperTranscriptionService implements TranscriptionService {
  static isConfigured(): boolean {
    return !!WHISPER_API_KEY;
  }

  async transcribe(mediaPath: string, language = 'en'): Promise<CaptionWord[]> {
    if (!WHISPER_API_KEY) {
      throw new Error(
        'Whisper API key missing. Add EXPO_PUBLIC_WHISPER_API_KEY to your .env file.',
      );
    }
    const form = new FormData();
    form.append('file', {
      uri: mediaPath,
      name: 'audio.m4a',
      type: 'audio/m4a',
    } as unknown as Blob);
    form.append('model', 'whisper-1');
    form.append('response_format', 'verbose_json');
    form.append('timestamp_granularities[]', 'word');
    form.append('language', language);

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${WHISPER_API_KEY}` },
      body: form,
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Whisper request failed (${res.status}): ${body.slice(0, 200)}`);
    }
    const json = await res.json();
    const rawWords: Array<{ word: string; start: number; end: number }> = json.words ?? [];
    return rawWords.map((w, i) => ({
      id: `w${i}`,
      text: w.word,
      start: w.start,
      end: w.end,
    }));
  }
}
