# CaptionAI 🎙️

**Pro-level AI Caption Generator & Kinetic Typography App** (Flutter)

Inspired by KineCut — Auto captions, word-level animations, timeline editor, premium styles.

## Features (Roadmap)

- [x] Project structure & theme
- [x] Home screen (project list, kinetic hero, new-project flow)
- [x] Video / Audio picker + player (Chewie video, custom audio UI)
- [x] AI Transcription (mock demo + Whisper API service scaffold)
- [x] Word-level timeline editor (edit text/timing, delete, auto-scroll)
- [x] Kinetic text animations & 6 style presets (live preview)
- [x] Caption burn-in & export (SRT + ASS + FFmpeg)
- [x] Multi-language support (language picker ready via transcription `language` param)
- [ ] Premium fonts & styles (in-app purchase — planned)

## Phase 2 — Pro features (this branch)

What was built:

- **Projects**: create from video/audio import, rename, delete, auto-persisted as JSON
  (`lib/features/home/`, `lib/services/storage/project_storage.dart`)
- **Media picking**: gallery + file picker with runtime permission handling
  (`lib/services/media/media_picker_service.dart`)
- **Player**: Chewie video player + custom audio player with seek
  (`lib/features/player/player_screen.dart`)
- **Transcription**: `TranscriptionService` interface, realistic `MockTranscriptionService`
  (~30s demo), and `WhisperTranscriptionService` (OpenAI Whisper API, word timestamps)
- **Editor**: word chips timeline, tap-to-edit text/timing bottom sheet, delete words,
  mock playback clock with auto-scroll + current-word highlight, time ruler
  (`lib/features/editor/`)
- **Kinetic styles**: 6 presets — Pop, Karaoke, Typewriter, Bounce, Glow, Minimal —
  with hand-rolled animated live preview (`lib/features/kinetic/`)
- **Export**: `.srt` + `.ass` generation, style-aware ASS styling, FFmpeg burn-in with
  progress callback, 720p/1080p resolution choice (`lib/services/video/`, `lib/features/export/`)
- **Navigation**: named routes `/home`, `/player`, `/editor`, `/export`

What still needs a real device / keys before this is fully pro-level:

1. **Whisper API key** — run with `--dart-define=WHISPER_API_KEY=sk-...`
   (never hardcoded; see `whisper_transcription_service.dart`).
2. **On-device testing** — `flutter run` on Android/iOS to verify pickers, permissions,
   Chewie playback, FFmpeg burn-in, and Google Fonts loading.
3. **Real media durations** — `MediaFile.durationSeconds` is currently a best-effort
   estimate; probe with FFmpeg or `video_player` after picking.
4. **Play Store signing** + release build config.

## Tech Stack

- Flutter 3.x
- FFmpeg Kit (video processing)
- Whisper (speech-to-text)
- Google Fonts
- Provider / Riverpod (state management)

## Getting Started

```bash
git clone https://github.com/gamxsharma305-png/CaptionAI.git
cd CaptionAI
flutter pub get
flutter run
# with real transcription:
flutter run --dart-define=WHISPER_API_KEY=sk-...
```

## Project Structure

```
lib/
├── main.dart
├── app.dart
├── core/
│   ├── theme/
│   └── constants/
├── features/
│   ├── home/        # home screen, project provider, widgets
│   ├── player/      # video/audio player
│   ├── editor/      # word-level timeline editor
│   ├── kinetic/     # style presets + live preview
│   └── export/      # style picker + FFmpeg export
├── shared/
│   └── models/      # project, caption_word, caption_style, media_file
└── services/
    ├── media/         # pickers
    ├── transcription/ # mock + whisper
    ├── video/         # export / burn-in
    └── storage/       # project persistence
```

---

Made with ❤️ for creators
