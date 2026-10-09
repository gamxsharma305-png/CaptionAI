import '../../shared/models/caption_word.dart';

/// Converts a media file into word-level captions.
///
/// Implementations may call a cloud API (Whisper), run an on-device model,
/// or return demo data for UI development.
abstract class TranscriptionService {
  /// Transcribes the media at [mediaPath] and returns word-level timestamps.
  ///
  /// [language] is a BCP-47-ish code such as 'en', 'hi', 'hinglish'.
  Future<List<CaptionWord>> transcribe(String mediaPath, {String language = 'en'});
}
