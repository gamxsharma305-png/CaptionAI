import 'dart:async';

import 'package:flutter/material.dart';

import '../../shared/models/caption_style.dart';
import '../../shared/models/caption_word.dart';
import 'kinetic_styles.dart';

/// Live kinetic preview: cycles through [words], animating each one with the
/// motion defined by [preset]. Hand-rolled — no extra dependencies.
class KineticPreview extends StatefulWidget {
  final List<CaptionWord> words;
  final KineticPreset preset;
  final Duration wordDuration;
  final double height;

  const KineticPreview({
    super.key,
    required this.words,
    required this.preset,
    this.wordDuration = const Duration(milliseconds: 650),
    this.height = 220,
  });

  @override
  State<KineticPreview> createState() => _KineticPreviewState();
}

class _KineticPreviewState extends State<KineticPreview> {
  Timer? _timer;
  int _index = 0;

  List<CaptionWord> get _words =>
      widget.words.isEmpty ? _fallbackWords : widget.words;

  static final _fallbackWords = [
    CaptionWord(id: 'd1', text: 'YOUR', startTime: 0, endTime: 0.5),
    CaptionWord(id: 'd2', text: 'WORDS', startTime: 0.5, endTime: 1),
    CaptionWord(id: 'd3', text: 'IN', startTime: 1, endTime: 1.5),
    CaptionWord(id: 'd4', text: 'MOTION', startTime: 1.5, endTime: 2),
  ];

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(widget.wordDuration, (_) {
      if (!mounted) return;
      setState(() => _index = (_index + 1) % _words.length);
    });
  }

  @override
  void didUpdateWidget(KineticPreview oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.words != widget.words) _index = 0;
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final preset = widget.preset;
    final word = _words[_index % _words.length];
    final isGlow = preset.id == 'glow';

    return Container(
      height: widget.height,
      width: double.infinity,
      decoration: BoxDecoration(
        color: preset.backgroundColor ?? const Color(0xFF0A0F0D),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Stack(
        children: [
          Center(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 380),
              transitionBuilder: (child, animation) =>
                  _transition(child, animation, preset.animation),
              child: Text(
                word.text.toUpperCase(),
                key: ValueKey('${preset.id}_${word.id}_$_index'),
                textAlign: TextAlign.center,
                style: preset.textStyle(color: preset.highlightColor).copyWith(
                  shadows: isGlow
                      ? [
                          const Shadow(
                            color: Color(0xFF00E5FF),
                            blurRadius: 24,
                          ),
                          const Shadow(
                            color: Color(0xFFFF00FF),
                            blurRadius: 48,
                          ),
                        ]
                      : null,
                ),
              ),
            ),
          ),
          Positioned(
            right: 12,
            bottom: 8,
            child: Text(
              '${(_index % _words.length) + 1} / ${_words.length}',
              style: TextStyle(
                color: (preset.backgroundColor == null
                        ? Colors.white
                        : Colors.black)
                    .withOpacity(0.4),
                fontSize: 11,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _transition(
      Widget child, Animation<double> animation, AnimationType type) {
    switch (type) {
      case AnimationType.pop:
        return ScaleTransition(
          scale: Tween<double>(begin: 0.4, end: 1.0).animate(
            CurvedAnimation(parent: animation, curve: Curves.elasticOut),
          ),
          child: FadeTransition(opacity: animation, child: child),
        );
      case AnimationType.bounce:
        return ScaleTransition(
          scale: Tween<double>(begin: 0.3, end: 1.0).animate(
            CurvedAnimation(parent: animation, curve: Curves.bounceOut),
          ),
          child: child,
        );
      case AnimationType.zoom:
        return ScaleTransition(
          scale: Tween<double>(begin: 1.6, end: 1.0).animate(
            CurvedAnimation(parent: animation, curve: Curves.easeOutCubic),
          ),
          child: FadeTransition(opacity: animation, child: child),
        );
      case AnimationType.rise:
      case AnimationType.slide:
        return SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0, 0.6),
            end: Offset.zero,
          ).animate(
              CurvedAnimation(parent: animation, curve: Curves.easeOutCubic)),
          child: FadeTransition(opacity: animation, child: child),
        );
      case AnimationType.karaoke:
        return FadeTransition(
          opacity: Tween<double>(begin: 0.2, end: 1.0).animate(animation),
          child: ScaleTransition(
            scale: Tween<double>(begin: 0.92, end: 1.0).animate(animation),
            child: child,
          ),
        );
      case AnimationType.typewriter:
        return SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(-0.25, 0),
            end: Offset.zero,
          ).animate(animation),
          child: FadeTransition(opacity: animation, child: child),
        );
      case AnimationType.fade:
      case AnimationType.glitch:
        return FadeTransition(opacity: animation, child: child);
    }
  }
}
