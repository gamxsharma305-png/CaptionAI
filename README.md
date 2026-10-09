# CaptionAI (Expo)

**AI Caption Generator & Kinetic Typography** — built with Expo (React Native + TypeScript).
KineCut / CapCut inspired: import a video, auto-transcribe with free Groq Whisper,
style every word, make 9:16 typography reels, export.

## Setup

```bash
npm install
npx expo start
```

Run on a device with Expo Go, or `npx expo run:android` / `npx expo run:ios`
for a dev build (needed for FFmpeg burn-in later).

> **Zero-error build:** this repo is verified with `npx tsc --noEmit`,
> `npx expo-doctor` and a full `npx expo export --platform android`
> production bundle — all clean. See *Verification* below.

## First launch: API keys

On first launch the app opens **Set up CaptionAI**:

1. **Groq key (required, free)** — tap *Get my free Groq key*, sign in with
   Google at console.groq.com, create a key, paste it back. The app
   **verifies the key live** (`GET api.groq.com/openai/v1/models` must return
   HTTP 200) — *Verify & continue* stays disabled until it does.
2. **Gemini key (optional, free)** — backup key from Google AI Studio, verified
   the same way.

Keys are stored **only on-device** in `expo-secure-store` and sent directly to
Groq / Google. Change or remove them anytime via the ⚙️ icon on Home → API Keys.

## Features

- **Home** — project list (video + 9:16 reels) with duplicate/delete, "New Project"
  sheet (import video / import audio / new 9:16 reel), animated empty-state hero.
- **Player** — `expo-video` playback, one-tap **Auto Transcribe** with
  **free Groq Whisper** (`whisper-large-v3-turbo`, word-level timestamps),
  language picker (Auto + 12 languages), demo mock fallback when no key is set.
- **Editor** — word-level timeline: tap a word to edit text/start/end, add/delete
  words, playback-synced highlight with auto-scroll, auto-save.
- **Reel Studio** — 9:16 typography reel maker: live canvas, 10 font families,
  12 animations, 6 backgrounds (solids + gradients); *Use in project* creates a
  reel project ready to export at 1080×1920.
- **Export** — live kinetic preview, 12 premium styles + your custom styles
  (long-press a style to customize colors / font size / background), export
  presets (16:9 720p, 16:9 1080p, 9:16 reel), SRT+ASS builders and FFmpeg
  burn-in commands (see TODO in `src/services/export.ts` for the on-device
  FFmpeg binding).
- **Persistence** — projects and custom styles stored locally (AsyncStorage);
  API keys in secure storage.

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

## Fonts (10 families)

Inter, Bebas Neue, Anton, Space Mono, Archivo, Poppins, Oswald,
Playfair Display, Pacifico, Montserrat — bundled via `@expo-google-fonts/*`
and loaded once in `app/_layout.tsx`.

## Project structure

```
app/                # expo-router screens
  _layout.tsx       # Stack + font loading + onboarding gate + dark chrome
  index.tsx         # Home (projects, duplicate/delete, API keys gear)
  setup.tsx         # API key onboarding with live verification
  player.tsx        # Video player + Groq transcribe + language picker
  editor.tsx        # Word-level timeline editor
  reel.tsx          # 9:16 Reel Studio
  export.tsx        # Style picker + custom style editor + export presets
src/
  theme.ts          # dark pro theme tokens
  models.ts         # CaptionWord, CaptionStyle, Project (video|reel), MediaFile
  fonts.ts          # Google Fonts registry (expo-font)
  styles/captionStyles.ts   # the 12 premium styles
  components/
    KineticPreview.tsx      # live looping caption animation engine
    StylePicker.tsx         # grid with live mini previews + long-press edit
  services/
    keys.ts           # Groq/Gemini verification + SecureStore key storage
    mediaPicker.ts    # video/audio import
    transcription.ts  # interface + mock + Groq Whisper (free tier)
    storage.ts        # AsyncStorage project CRUD + duplicate
    customStyles.ts   # user-created style persistence
    export.ts         # SRT/ASS builders + FFmpeg burn-in commands (16:9 + 9:16)
```

## Verification

Run from the project root:

```bash
npm install
npx tsc --noEmit        # must print nothing
npx expo-doctor         # must report no issues
npx expo export --platform android   # full production Metro bundle must succeed
npx expo config --type public        # must print valid config
```

All four pass on a clean checkout (verified 2026-10-10).

## Before your EAS build

- [ ] Add real app assets: `assets/icon.png` (1024×1024), splash image —
      `app.json` references `./assets/icon.png` which is not in the repo yet.
- [ ] Run `eas init` to link an EAS project id (adds `extra.eas.projectId`).
- [ ] Wire a real FFmpeg binding (`ffmpeg-kit` / `expo-ffmpeg-kit`) into
      `exportProject` — currently builds SRT/ASS + the exact FFmpeg command
      and simulates progress.
- [ ] Test on a real device: pickers/permissions, expo-video playback,
      Google Fonts loading, Groq transcription with a real key.
- [ ] For production, proxy Groq through your own backend instead of
      shipping the user key flow as-is.

## Roadmap

- Premium fonts/styles IAP.
- Multi-clip reel timeline.
- EAS Build + store release config.
