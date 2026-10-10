# CaptionAI 🎙️

**AI Caption Generator & Kinetic Typography** — built with Expo (React Native + TypeScript).
KineCut / CapCut inspired: import a video, auto-transcribe with free Groq Whisper,
style every word, make 9:16 typography reels, export.

Your logo (yellow bars + arrow on black) is ready as `assets/logo.svg`.

---

## Setup

```bash
git clone https://github.com/gamxsharma305-png/CaptionAI.git
cd CaptionAI
npm install
npx expo start
```

Run on a device with Expo Go, or `npx expo run:android` / `npx expo run:ios`
for a dev build.

---

## 🖼️ Logo / App Icon (REQUIRED for APK)

`assets/logo.svg` is already in the repo (exact match of your design).

**You must add PNG files** so Expo can put the icon on the APK:

1. Take the logo image you shared.
2. Resize / export as **1024×1024 PNG** and place these files in the `assets/` folder:

```
assets/icon.png              ← main app icon (required)
assets/adaptive-icon.png     ← Android adaptive icon (same image OK)
assets/splash.png            ← splash (logo centered on #0B0B10)
assets/favicon.png           ← optional 48×48
```

**Fast way:**
- https://www.appicon.co or https://easyappicon.com → upload logo → download pack → copy into `assets/`

After adding the PNGs the icon will appear on the built APK.

---

## 📱 Build APK with Expo (EAS)

### 1. Install & login
```bash
npm install -g eas-cli
eas login
```

### 2. Configure (first time)
```bash
eas build:configure
```
This fills `extra.eas.projectId` in `app.json`.

### 3. Build APK
```bash
# Preview / test APK
eas build -p android --profile preview

# Production APK
eas build -p android --profile production
```

When finished, Expo gives a download link for the `.apk`.
You can also manage builds at https://expo.dev

`eas.json` is already configured for APK output.

---

## First launch: API keys

On first launch the app opens **Set up CaptionAI**:

1. **Groq key (required, free)** — get from console.groq.com, paste & verify.
2. **Gemini key (optional)** — from Google AI Studio.

Keys stay on-device in `expo-secure-store`.

---

## Features

- **Home** — project list, New Project sheet, empty-state hero
- **Player** — expo-video + Auto Transcribe (Groq Whisper word-level)
- **Editor** — word-level timeline, edit text/timing, auto-save
- **Reel Studio** — 9:16 typography reels, 10 fonts, 12 animations
- **Export** — 12 premium styles + custom styles, SRT/ASS + FFmpeg commands

## The 12 premium styles

| # | Style | Signature animation |
|---|-------|---------------------|
| 1 | Karaoke Gold | karaoke |
| 2 | Pop Punch | pop |
| 3 | Typewriter Mono | typewriter |
| 4 | Bounce Fun | bounce |
| 5 | Neon Glow | glow-pulse |
| 6 | Minimal Clean | minimal |
| 7 | Impact Bold | scale-punch |
| 8 | Outline Pro | outline |
| 9 | Gradient Hype | slide-in |
| 10 | CapCut Highlight | word-highlight |
| 11 | Fade Up Elegant | fade-up |
| 12 | Classic Stroke | minimal |

## Project structure

```
app/                # expo-router screens
src/
  components/       # KineticPreview, StylePicker
  services/         # transcription, export, keys, storage...
  styles/
  theme.ts
  models.ts
assets/
  logo.svg          # ✅ your logo (already added)
  icon.png          # ← you add this (1024×1024)
  adaptive-icon.png # ← you add this
  splash.png        # ← you add this
app.json
eas.json            # APK build profiles ready
```

## Package name

`com.captionai.app`

---

Made for creators ✨
