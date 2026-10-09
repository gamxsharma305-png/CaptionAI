/// A media file picked by the user (video or audio).
enum MediaType { video, audio }

class MediaFile {
  final String path;
  final MediaType type;
  final String name;
  final double? durationSeconds; // best-effort estimate, may be null

  const MediaFile({
    required this.path,
    required this.type,
    required this.name,
    this.durationSeconds,
  });

  bool get isVideo => type == MediaType.video;
  bool get isAudio => type == MediaType.audio;
}
