import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/theme/app_theme.dart';

/// Horizontal time ruler with a moving playhead.
///
/// Full-width; the playhead sits at [position] / [duration].
class TimelineRuler extends StatelessWidget {
  final double duration; // seconds
  final double position; // seconds

  const TimelineRuler({
    super.key,
    required this.duration,
    required this.position,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 56,
      child: CustomPaint(
        painter: _RulerPainter(
          duration: duration <= 0 ? 1 : duration,
          progress: duration <= 0
              ? 0
              : (position / duration).clamp(0.0, 1.0),
        ),
        child: Container(),
      ),
    );
  }
}

class _RulerPainter extends CustomPainter {
  final double duration;
  final double progress;

  _RulerPainter({required this.duration, required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    final minorTick = Paint()
      ..color = Colors.white.withOpacity(0.18)
      ..strokeWidth = 1;
    final majorTick = Paint()
      ..color = Colors.white.withOpacity(0.45)
      ..strokeWidth = 1.5;
    final playhead = Paint()
      ..color = AppTheme.primary
      ..strokeWidth = 2.5;

    // Ticks: minor every 1s, major every 5s (adaptive for long media).
    final step = duration > 120 ? 5.0 : 1.0;
    final majorEvery = duration > 120 ? 30.0 : 5.0;

    var t = 0.0;
    while (t <= duration) {
      final x = (t / duration) * size.width;
      final isMajor = (t % majorEvery) < 0.001 || t == 0;
      canvas.drawLine(
        Offset(x, size.height - (isMajor ? 22 : 12)),
        Offset(x, size.height - 4),
        isMajor ? majorTick : minorTick,
      );
      if (isMajor && t > 0) {
        final label = _label(t);
        final tp = TextPainter(
          text: TextSpan(
            text: label,
            style: GoogleFonts.inter(
              fontSize: 10,
              color: AppTheme.textSecondary,
            ),
          ),
          textDirection: TextDirection.ltr,
        )..layout();
        tp.paint(canvas, Offset((x - tp.width / 2).clamp(0, size.width - tp.width), 2));
      }
      t += step;
    }

    // Playhead.
    final px = (progress * size.width).clamp(0.0, size.width);
    canvas.drawLine(Offset(px, 0), Offset(px, size.height), playhead);
    canvas.drawCircle(Offset(px, 4), 4, playhead..style = PaintingStyle.fill);
  }

  String _label(double seconds) {
    final m = seconds ~/ 60;
    final s = (seconds % 60).round();
    return '$m:${s.toString().padLeft(2, '0')}';
  }

  @override
  bool shouldRepaint(covariant _RulerPainter old) =>
      old.duration != duration || old.progress != progress;
}
