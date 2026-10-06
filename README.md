# CaptionAI 🎙️

**Pro-level AI Caption Generator & Kinetic Typography App** (Flutter)

Inspired by KineCut — Auto captions, word-level animations, timeline editor, premium styles.

## Features (Roadmap)

- [x] Project structure & theme
- [ ] Home screen (Kinetic Typography + Auto Captions)
- [ ] Video / Audio picker
- [ ] AI Transcription (Whisper)
- [ ] Word-level timeline editor
- [ ] Kinetic text animations & styles
- [ ] Caption burn-in & export
- [ ] Multi-language support
- [ ] Premium fonts & styles

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
```

## Project Structure

```
lib/
├── main.dart
├── app.dart
├── core/
│   ├── theme/
│   ├── constants/
│   └── utils/
├── features/
│   ├── home/
│   ├── kinetic/
│   ├── captions/
│   ├── editor/
│   └── export/
├── shared/
│   ├── widgets/
│   └── models/
└── services/
    ├── transcription/
    ├── video/
    └── storage/
```

## Development Plan (5-10 days)

| Day | Goal |
|-----|------|
| 1   | Project setup + Home UI |
| 2   | Video/Audio picker + basic player |
| 3   | Transcription service (mock + real) |
| 4   | Timeline editor |
| 5-6 | Kinetic styles & animations |
| 7   | Caption burn-in with FFmpeg |
| 8   | Polish UI + styles |
| 9-10| Testing + Play Store prep |

---

Made with ❤️ for creators
