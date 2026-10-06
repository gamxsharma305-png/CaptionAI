class CaptionWord {
  final String id;
  final String text;
  final double startTime; // in seconds
  final double endTime;   // in seconds
  final bool isHighlighted;

  CaptionWord({
    required this.id,
    required this.text,
    required this.startTime,
    required this.endTime,
    this.isHighlighted = false,
  });

  Duration get start => Duration(milliseconds: (startTime * 1000).round());
  Duration get end => Duration(milliseconds: (endTime * 1000).round());

  CaptionWord copyWith({
    String? id,
    String? text,
    double? startTime,
    double? endTime,
    bool? isHighlighted,
  }) {
    return CaptionWord(
      id: id ?? this.id,
      text: text ?? this.text,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      isHighlighted: isHighlighted ?? this.isHighlighted,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'text': text,
        'startTime': startTime,
        'endTime': endTime,
      };

  factory CaptionWord.fromJson(Map<String, dynamic> json) {
    return CaptionWord(
      id: json['id'] as String,
      text: json['text'] as String,
      startTime: (json['startTime'] as num).toDouble(),
      endTime: (json['endTime'] as num).toDouble(),
    );
  }
}
