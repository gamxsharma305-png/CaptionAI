import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:uuid/uuid.dart';

import '../../shared/models/caption_word.dart';
import 'transcription_service.dart';

/// OpenAI Whisper transcription via the cloud API.
///
/// ---------------------------------------------------------------------------
/// TODO (setup): this service needs an API key at build/run time. The key is
/// read from a Dart define and is NEVER hardcoded or committed:
///
///   flutter run --dart-define=WHISPER_API_KEY=sk-...
///   flutter build apk --dart-define=WHISPER_API_KEY=sk-...
///
/// For production, prefer routing through your own backend (or a per-user
/// key vault) instead of shipping the key inside the app binary.
/// ---------------------------------------------------------------------------
class WhisperTranscriptionService implements TranscriptionService {
  static const String _apiKey = String.fromEnvironment('WHISPER_API_KEY');
  static const _uuid = Uuid();

  bool get isConfigured => _apiKey.isNotEmpty;

  @override
  Future<List<CaptionWord>> transcribe(String mediaPath, {String language = 'en'}) async {
    if (!isConfigured) {
      throw StateError(
        'WHISPER_API_KEY is not set. Re-run with '
        '--dart-define=WHISPER_API_KEY=sk-...',
      );
    }

    final request = http.MultipartRequest(
      'POST',
      Uri.parse('https://api.openai.com/v1/audio/transcriptions'),
    )
      ..headers['Authorization'] = 'Bearer $_apiKey'
      ..fields['model'] = 'whisper-1'
      ..fields['response_format'] = 'verbose_json'
      // Ask for word-level timestamps.
      ..fields['timestamp_granularities[]'] = 'word'
      ..files.add(await http.MultipartFile.fromPath('file', mediaPath));

    if (language != 'auto') {
      request.fields['language'] = language;
    }

    final streamed = await request.send();
    final response = await http.Response.fromStream(streamed);

    if (response.statusCode != 200) {
      throw Exception(
        'Whisper transcription failed (${response.statusCode}): ${response.body}',
      );
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    final wordsJson = data['words'] as List<dynamic>? ?? const [];

    return wordsJson.map((entry) {
      final map = Map<String, dynamic>.from(entry as Map);
      return CaptionWord(
        id: _uuid.v4(),
        text: (map['word'] as String? ?? '').trim(),
        startTime: (map['start'] as num? ?? 0).toDouble(),
        endTime: (map['end'] as num? ?? 0).toDouble(),
      );
    }).where((w) => w.text.isNotEmpty).toList();
  }
}
