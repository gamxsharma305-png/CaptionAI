class AppConstants {
  static const String appName = 'CaptionAI';
  static const String appTagline = 'Free forever. Your keys, your files.';

  // Supported audio formats
  static const List<String> audioExtensions = ['mp3', 'wav', 'm4a', 'aac', 'ogg'];
  static const List<String> videoExtensions = ['mp4', 'mov', 'mkv', 'avi', 'webm'];

  // Languages (Phase 1)
  static const List<Map<String, String>> languages = [
    {'code': 'en', 'name': 'English'},
    {'code': 'hi', 'name': 'Hindi'},
    {'code': 'hinglish', 'name': 'Hinglish (Hindi → Roman)'},
    {'code': 'ur', 'name': 'Urdu'},
    {'code': 'pa', 'name': 'Punjabi'},
    {'code': 'bn', 'name': 'Bengali'},
  ];

  // Style IDs
  static const String styleCinematic = 'cinematic';
  static const String styleEditorial = 'editorial';
  static const String styleNeon = 'neon_nights';
  static const String styleConfetti = 'confetti_pop';
  static const String styleKaraoke = 'karaoke';
  static const String styleMinimal = 'warm_minimalist';
}
