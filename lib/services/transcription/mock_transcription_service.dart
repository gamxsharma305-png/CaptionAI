import 'package:uuid/uuid.dart';

import '../../shared/models/caption_word.dart';
import 'transcription_service.dart';

/// Demo transcription used for UI development and on-device testing without
/// an API key.
///
/// Produces realistic word-level timestamps spread over ~30 seconds so the
/// timeline editor, kinetic preview and export flows can be exercised
/// end-to-end before a real transcription backend is wired up.
class MockTranscriptionService implements TranscriptionService {
  static const _uuid = Uuid();

  static const List<String> _demoScript = [
    'Welcome', 'to', 'CaptionAI,', 'the', 'fastest', 'way', 'to', 'turn',
    'your', 'videos', 'into', 'scroll-stopping', 'content.', 'Every', 'word',
    'is', 'timed', 'perfectly,', 'so', 'your', 'captions', 'hit', 'exactly',
    'when', 'you', 'speak.', 'Pick', 'a', 'style,', 'watch', 'the', 'magic',
    'happen,', 'and', 'export', 'in', 'one', 'tap.',
  ];

  @override
  Future<List<CaptionWord>> transcribe(String mediaPath, {String language = 'en'}) async {
    // Simulate network/model latency.
    await Future<void>.delayed(const Duration(seconds: 2));

    final words = <CaptionWord>[];
    double cursor = 0.4; // small lead-in silence

    for (final text in _demoScript) {
      // Longer words get slightly more screen time — feels like real speech.
      final duration = 0.26 + text.length * 0.035;
      words.add(
        CaptionWord(
          id: _uuid.v4(),
          text: text,
          startTime: _round2(cursor),
          endTime: _round2(cursor + duration),
        ),
      );
      cursor += duration + 0.07; // natural inter-word gap
    }

    return words;
  }

  double _round2(double v) => (v * 100).round() / 100;
}
