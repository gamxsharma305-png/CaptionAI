import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../shared/models/caption_style.dart';

/// Signature shared by the GoogleFonts builders we use for presets.
typedef FontBuilder = TextStyle Function({
  Color? color,
  double? fontSize,
  FontWeight? fontWeight,
  double? letterSpacing,
  double? height,
});

/// One kinetic typography preset: font + colors + motion.
///
/// Kept separate from [CaptionStyle] (the burn-in style) so the live preview
/// can use rich Google Fonts while export maps to the closest ASS equivalent.
class KineticPreset {
  final String id;
  final String name;
  final String description;
  final FontBuilder fontBuilder;
  final double fontSize;
  final Color textColor;
  final Color highlightColor;
  final Color? backgroundColor;
  final AnimationType animation;
  final bool isPremium;

  const KineticPreset({
    required this.id,
    required this.name,
    required this.description,
    required this.fontBuilder,
    this.fontSize = 40,
    required this.textColor,
    required this.highlightColor,
    this.backgroundColor,
    required this.animation,
    this.isPremium = false,
  });

  TextStyle textStyle({Color? color, double? size}) => fontBuilder(
        color: color ?? textColor,
        fontSize: size ?? fontSize,
        fontWeight: FontWeight.w800,
        letterSpacing: 1.2,
        height: 1.1,
      );
}

class KineticPresets {
  static const List<KineticPreset> all = [
    KineticPreset(
      id: 'pop',
      name: 'Pop',
      description: 'Bold words that punch in',
      fontBuilder: GoogleFonts.anton,
      textColor: Colors.white,
      highlightColor: Color(0xFF00E676),
      animation: AnimationType.pop,
    ),
    KineticPreset(
      id: 'karaoke',
      name: 'Karaoke',
      description: 'Word-by-word highlight sweep',
      fontBuilder: GoogleFonts.poppins,
      fontSize: 36,
      textColor: Colors.white70,
      highlightColor: Color(0xFF00E676),
      animation: AnimationType.karaoke,
    ),
    KineticPreset(
      id: 'typewriter',
      name: 'Typewriter',
      description: 'Retro mono typing effect',
      fontBuilder: GoogleFonts.robotoMono,
      fontSize: 32,
      textColor: Color(0xFFFFC107),
      highlightColor: Color(0xFFFFF8E1),
      animation: AnimationType.typewriter,
    ),
    KineticPreset(
      id: 'bounce',
      name: 'Bounce',
      description: 'Playful springy entrance',
      fontBuilder: GoogleFonts.baloo2,
      textColor: Colors.white,
      highlightColor: Color(0xFFFF6B9D),
      animation: AnimationType.bounce,
    ),
    KineticPreset(
      id: 'glow',
      name: 'Glow',
      description: 'Neon glow for night vibes',
      fontBuilder: GoogleFonts.orbitron,
      fontSize: 34,
      textColor: Color(0xFF00E5FF),
      highlightColor: Color(0xFFFF00FF),
      animation: AnimationType.zoom,
    ),
    KineticPreset(
      id: 'minimal',
      name: 'Minimal',
      description: 'Clean editorial fade',
      fontBuilder: GoogleFonts.inter,
      fontSize: 30,
      textColor: Color(0xFF3E2723),
      highlightColor: Color(0xFFC2185B),
      backgroundColor: Color(0xFFFFF8E1),
      animation: AnimationType.fade,
    ),
  ];

  static KineticPreset getById(String id) =>
      all.firstWhere((p) => p.id == id, orElse: () => all.first);
}
