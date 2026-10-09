# CaptionAI (Expo)

**AI Caption Generator & Kinetic Typography** — rebuilt with Expo (React Native + TypeScript).
KineCut / CapCut inspired: import a video, auto-transcribe, style every word, export.

## Setup

```bash
npm install
npx expo start
```

Run on a device with Expo Go, or `npx expo run:android` / `npx expo run:ios`
for a dev build (needed for FFmpeg burn-in later).

## Features

- **Home** — project list with rename/delete, "New Project" sheet (import video/audio), animated empty-state hero.
- **Player** — `expo-video` playback, one-tap **Auto Transcribe** (Whisper when a key is configured, demo mock otherwise).
- **Editor** — word-level timeline: tap a word to edit text/start/end, add/delete words, playback-synced highlight, auto-save.
- **Export** — live kinetic preview, 12 premium styles, 720p/1080p, SRT+ASS builders and an FFmpeg burn-in command (see TODO in `src/services/export.ts` for the on-device FFmpeg binding).
- **Persistence** — projects stored locally with AsyncStorage.

## The 12 premium styles

| # | Style | Look | Signature animation |
|---|-------|------|---------------------|
| 1 | Karaoke Gold | Gold sing-along glow on a dark pill | karaoke |
| 2 | Pop Punch | Heavy black type, yellow pop, thick stroke | pop |
| 3 | Typewriter Mono | Retro green-on-black terminal | typewriter |
| 4 | Bounce Fun | Playful purple pill, bouncy words | bounce |
| 5 | Neon Glow | Electric cyan neon, tall condensed type | glow-pulse |
| 6 | Minimal Clean | Understated pro subtitles | minimal |
| 7 | Impact Bold | Meme-style heavy hitter, 4px stroke | scale-punch |
| 8 | Outline Pro | Hollow outline that fills on beat | outline |
| 9 | Gradient Hype | Streetwear acid-box hype | slide-in |
| 10 | CapCut Highlight | Auto-caption word pill highlight | word-highlight |
| 11 | Fade Up Elegant | Cinematic lower-third fade | fade-up |
| 12 | Classic Stroke | Timeless white-on-black TV subtitle | minimal |

All animations are hand-rolled with the React Native `Animated` API — no extra dependencies.

## Whisper API key (real transcription)

1. Create `.env` in the project root (never commit it):
   ```
   EXPO_PUBLIC_WHISPER_API_KEY=sk-...
   ```
2. Restart the dev server: `npx expo start -c`

Without a key, the app falls back to a realistic demo transcription so the
whole flow is testable. For production, proxy Whisper through your own backend
instead of shipping the key in the client.

## Project structure

```
app/                # expo-router screens
  _layout.tsx       # Stack + font loading + dark theme chrome
  index.tsx         # Home
  player.tsx        # Video player + transcribe actions
  editor.tsx        # Word-level timeline editor
  export.tsx        # Style picker + export
src/
  theme.ts          # dark pro theme tokens
  models.ts         # CaptionWord, CaptionStyle, Project, MediaFile
  fonts.ts          # Google Fonts registry (expo-font)
  styles/captionStyles.ts   # the 12 premium styles
  components/
    KineticPreview.tsx      # live looping caption animation engine
    StylePicker.tsx         # 2-col grid with live mini previews
  services/
    mediaPicker.ts    # video/audio import
    transcription.ts  # interface + mock + Whisper scaffold
    storage.ts        # AsyncStorage project CRUD
    export.ts         # SRT/ASS builders + FFmpeg command
```

## Roadmap

- On-device FFmpeg burn-in (`ffmpeg-kit` binding) wired to `exportProject`.
- Real media duration probing after import.
- Multi-language transcription UI.
- Custom style creator (user-tuned fonts/colors/animations).
- EAS Build + store release config.
