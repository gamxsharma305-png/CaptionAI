import 'package:flutter/material.dart';

enum AnimationType {
  fade,
  rise,
  zoom,
  pop,
  bounce,
  typewriter,
  karaoke,
  slide,
  glitch,
}

class CaptionStyle {
  final String id;
  final String name;
  final String previewText;
  final Color textColor;
  final Color? highlightColor;
  final Color? backgroundColor;
  final double fontSize;
  final FontWeight fontWeight;
  final String? fontFamily;
  final AnimationType animation;
  final bool isPremium;

  const CaptionStyle({
    required this.id,
    required this.name,
    required this.previewText,
    required this.textColor,
    this.highlightColor,
    this.backgroundColor,
    this.fontSize = 28,
    this.fontWeight = FontWeight.w700,
    this.fontFamily,
    this.animation = AnimationType.pop,
    this.isPremium = false,
  });
}

// Predefined styles (KineCut inspired)
class CaptionStyles {
  static const List<CaptionStyle> all = [
    CaptionStyle(
      id: 'cinematic',
      name: 'Cinematic',
      previewText: 'Under the MOON we danced',
      textColor: Color(0xFFFFE4E1),
      highlightColor: Color(0xFFFF6B9D),
      fontSize: 32,
      fontWeight: FontWeight.w800,
      animation: AnimationType.fade,
    ),
    CaptionStyle(
      id: 'editorial',
      name: 'Editorial',
      previewText: 'the art of FORM meets function',
      textColor: Color(0xFF1A1A1A),
      backgroundColor: Color(0xFFF5F5F0),
      highlightColor: Color(0xFFC2185B),
      fontSize: 28,
      fontWeight: FontWeight.w600,
      animation: AnimationType.rise,
    ),
    CaptionStyle(
      id: 'neon_nights',
      name: 'Neon Nights',
      previewText: 'LATE NIGHT vibes',
      textColor: Color(0xFFFF00FF),
      highlightColor: Color(0xFF00FFFF),
      fontSize: 30,
      fontWeight: FontWeight.w700,
      animation: AnimationType.pop,
    ),
    CaptionStyle(
      id: 'confetti_pop',
      name: 'Confetti Pop',
      previewText: 'you LIGHT up my WORLD',
      textColor: Color(0xFFFFFFFF),
      highlightColor: Color(0xFFFFEB3B),
      fontSize: 28,
      animation: AnimationType.bounce,
    ),
    CaptionStyle(
      id: 'karaoke',
      name: 'Karaoke',
      previewText: 'Word by word highlight',
      textColor: Color(0xFFFFFFFF),
      highlightColor: Color(0xFF00E676),
      fontSize: 26,
      animation: AnimationType.karaoke,
    ),
    CaptionStyle(
      id: 'warm_minimalist',
      name: 'Warm Minimalist',
      previewText: 'LET THE WARM SUMMER LIGHT IN',
      textColor: Color(0xFF3E2723),
      backgroundColor: Color(0xFFFFF8E1),
      fontSize: 24,
      fontWeight: FontWeight.w500,
      animation: AnimationType.fade,
    ),
  ];

  static CaptionStyle getById(String id) {
    return all.firstWhere((s) => s.id == id, orElse: () => all.first);
  }
}
