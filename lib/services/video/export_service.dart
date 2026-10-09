import 'dart:io';

import 'package:ffmpeg_kit_flutter_new/ffmpeg_kit.dart';
import 'package:ffmpeg_kit_flutter_new/return_code.dart';
import 'package:ffmpeg_kit_flutter_new/session.dart';
import 'package:ffmpeg_kit_flutter_new/statistics.dart';
import 'package:flutter/material.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

import '../../shared/models/caption_style.dart';
import '../../shared/models/caption_word.dart';

/// Builds subtitle files from word timings and burns them into video with FFmpeg.
class ExportService {
  /// Groups words into readable caption lines (up to [maxWords] per cue).
  List<List<CaptionWord>> groupIntoCues(List<CaptionWord> words, {int maxWords = 7}) {
    final cues = <List<CaptionWord>>[];
    for (var i = 0; i < words.length; i += maxWords) {
      cues.add(words.sublist(i, (i + maxWords).clamp(0, words.length)));
    }
    return cues;
  }

  String _srtTime(double seconds) {
    final ms = (seconds * 1000).round();
    final h = ms ~/ 3600000;
    final m = (ms % 3600000) ~/ 60000;
    final s = (ms % 60000) ~/ 1000;
    final r = ms % 1000;
    return '${h.toString().padLeft(2, '0')}:'
        '${m.toString().padLeft(2, '0')}:'
        '${s.toString().padLeft(2, '0')},'
        '${r.toString().padLeft(3, '0')}';
  }

  /// Builds a SubRip (.srt) document from word timings.
  String buildSrt(List<CaptionWord> words) {
    final buffer = StringBuffer();
    var index = 1;
    for (final cue in groupIntoCues(words)) {
      if (cue.isEmpty) continue;
      buffer.writeln(index++);
      buffer.writeln('${_srtTime(cue.first.startTime)} --> ${_srtTime(cue.last.endTime)}');
      buffer.writeln(cue.map((w) => w.text).join(' '));
      buffer.writeln();
    }
    return buffer.toString();
  }

  /// ASS color is &HAABBGGRR (alpha, blue, green, red).
  String _assColor(Color color, {int alpha = 0}) {
    String hex(int v) => v.toRadixString(16).padLeft(2, '0').toUpperCase();
    return '&H${hex(alpha)}${hex(color.blue)}${hex(color.green)}${hex(color.red)}';
  }

  String _assTime(double seconds) {
    final cs = (seconds * 100).round(); // centiseconds
    final h = cs ~/ 360000;
    final m = (cs % 360000) ~/ 6000;
    final s = (cs % 6000) ~/ 100;
    final c = cs % 100;
    return '$h:${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}.${c.toString().padLeft(2, '0')}';
  }

  /// Builds an Advanced SubStation Alpha (.ass) document honoring [style].
  String buildAss(List<CaptionWord> words, CaptionStyle style, {String fontName = 'Arial'}) {
    final primary = _assColor(style.textColor);
    final secondary = _assColor(style.highlightColor ?? style.textColor);
    final back = _assColor(Colors.black, alpha: 0x80);

    final buffer = StringBuffer()
      ..writeln('[Script Info]')
      ..writeln('ScriptType: v4.00+')
      ..writeln('PlayResX: 1280')
      ..writeln('PlayResY: 720')
      ..writeln('ScaledBorderAndShadow: yes')
      ..writeln()
      ..writeln('[V4+ Styles]')
      ..writeln('Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, '
          'OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, '
          'ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, '
          'Alignment, MarginL, MarginR, MarginV, Encoding')
      ..writeln('Style: CaptionAI,$fontName,${style.fontSize.round()},$primary,$secondary,'
          '&H80000000,$back,${style.fontWeight.index >= FontWeight.w600.index ? -1 : 0},0,0,0,'
          '100,100,0.5,0,1,2,1,2,40,40,60,1')
      ..writeln()
      ..writeln('[Events]')
      ..writeln('Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text');

    for (final cue in groupIntoCues(words)) {
      if (cue.isEmpty) continue;
      final text = cue.map((w) => w.text).join(' ').replaceAll('\n', r'\N');
      buffer.writeln(
        'Dialogue: 0,${_assTime(cue.first.startTime)},${_assTime(cue.last.endTime)},'
        'CaptionAI,,0,0,0,, $text',
      );
    }
    return buffer.toString();
  }

  /// Writes [content] to a temp file named [fileName] and returns it.
  Future<File> writeTempFile(String fileName, String content) async {
    final dir = await getTemporaryDirectory();
    final file = File(p.join(dir.path, fileName));
    return file.writeAsString(content);
  }

  /// Escapes a file path for use inside an FFmpeg filter argument.
  String _escapeFilterPath(String path) {
    return path.replaceAll('\\', '/').replaceAll("'", r"'\''").replaceAll(':', r'\:');
  }

  /// Builds the FFmpeg command that scales/pads to [width]x[height] and
  /// burns the .ass subtitles into the video.
  String buildBurnInCommand({
    required String inputPath,
    required String assPath,
    required String outputPath,
    int width = 1280,
    int height = 720,
  }) {
    final filter =
        'scale=$width:$height:force_original_aspect_ratio=decrease,'
        'pad=$width:$height:(ow-iw)/2:(oh-ih)/2,'
        "subtitles='${_escapeFilterPath(assPath)}'";
    return '-y -i "$inputPath" -vf "$filter" -c:a copy "$outputPath"';
  }

  /// Runs the burn-in, reporting 0.0–1.0 progress. Throws on failure.
  Future<String> burnIn({
    required String inputPath,
    required List<CaptionWord> words,
    required CaptionStyle style,
    required double mediaDurationSeconds,
    int width = 1280,
    int height = 720,
    void Function(double progress)? onProgress,
  }) async {
    final stamp = DateTime.now().millisecondsSinceEpoch;
    final assFile = await writeTempFile('captions_$stamp.ass', buildAss(words, style));
    final dir = await getTemporaryDirectory();
    final outputPath = p.join(dir.path, 'captionai_export_$stamp.mp4');

    final command = buildBurnInCommand(
      inputPath: inputPath,
      assPath: assFile.path,
      outputPath: outputPath,
      width: width,
      height: height,
    );

    var success = false;
    await FFmpegKit.executeAsync(
      command,
      (Session session) async {
        final code = await session.getReturnCode();
        success = ReturnCode.isSuccess(code);
      },
      null,
      (Statistics stats) {
        final timeMs = stats.getTime();
        if (timeMs > 0 && mediaDurationSeconds > 0) {
          onProgress?.call((timeMs / 1000 / mediaDurationSeconds).clamp(0.0, 1.0));
        }
      },
    );

    if (!success) {
      throw Exception('FFmpeg burn-in failed. Command: $command');
    }
    onProgress?.call(1.0);
    return outputPath;
  }
}
