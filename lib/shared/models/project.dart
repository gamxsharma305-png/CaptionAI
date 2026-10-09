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

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'type': type.name,
        'mediaPath': mediaPath,
        'mediaType': mediaType,
        'words': words.map((w) => w.toJson()).toList(),
        'styleId': styleId,
        'languageCode': languageCode,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
        'duration': duration,
      };

  factory Project.fromJson(Map<String, dynamic> json) {
    return Project(
      id: json['id'] as String,
      name: json['name'] as String? ?? 'Untitled',
      type: ProjectType.values.firstWhere(
        (t) => t.name == (json['type'] as String?),
        orElse: () => ProjectType.autoCaptions,
      ),
      mediaPath: json['mediaPath'] as String?,
      mediaType: json['mediaType'] as String?,
      words: (json['words'] as List<dynamic>? ?? const [])
          .map((e) => CaptionWord.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList(),
      styleId: json['styleId'] as String? ?? 'cinematic',
      languageCode: json['languageCode'] as String? ?? 'en',
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
      updatedAt: DateTime.tryParse(json['updatedAt'] as String? ?? '') ?? DateTime.now(),
      duration: (json['duration'] as num?)?.toDouble(),
    );
  }
}
