import 'caption_word.dart';
import 'caption_style.dart';

enum ProjectType { kinetic, autoCaptions }

class Project {
  final String id;
  final String name;
  final ProjectType type;
  final String? mediaPath; // video or audio path
  final String? mediaType; // 'video' | 'audio'
  final List<CaptionWord> words;
  final String styleId;
  final String languageCode;
  final DateTime createdAt;
  final DateTime updatedAt;
  final double? duration; // seconds

  Project({
    required this.id,
    required this.name,
    required this.type,
    this.mediaPath,
    this.mediaType,
    this.words = const [],
    this.styleId = 'cinematic',
    this.languageCode = 'en',
    required this.createdAt,
    required this.updatedAt,
    this.duration,
  });

  CaptionStyle get style => CaptionStyles.getById(styleId);

  Project copyWith({
    String? id,
    String? name,
    ProjectType? type,
    String? mediaPath,
    String? mediaType,
    List<CaptionWord>? words,
    String? styleId,
    String? languageCode,
    DateTime? createdAt,
    DateTime? updatedAt,
    double? duration,
  }) {
    return Project(
      id: id ?? this.id,
      name: name ?? this.name,
      type: type ?? this.type,
      mediaPath: mediaPath ?? this.mediaPath,
      mediaType: mediaType ?? this.mediaType,
      words: words ?? this.words,
      styleId: styleId ?? this.styleId,
      languageCode: languageCode ?? this.languageCode,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      duration: duration ?? this.duration,
    );
  }
}
