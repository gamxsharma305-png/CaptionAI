import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';

import '../../core/theme/app_theme.dart';
import '../../shared/models/caption_word.dart';
import '../../shared/models/project.dart';
import '../export/export_screen.dart';
import '../home/project_provider.dart';
import '../../services/transcription/mock_transcription_service.dart';
import 'timeline_ruler.dart';

/// Word-level caption editor with a mock playback clock.
///
/// Words are edited, retimed and deleted here; timing drives the kinetic
/// preview and the FFmpeg export downstream.
class EditorScreen extends StatefulWidget {
  static const routeName = '/editor';

  final Project project;

  const EditorScreen({super.key, required this.project});

  @override
  State<EditorScreen> createState() => _EditorScreenState();
}

class _EditorScreenState extends State<EditorScreen> {
  static const _uuid = Uuid();
  static const double _chipExtent = 132;

  late List<CaptionWord> _words;
  double _position = 0;
  bool _playing = false;
  bool _transcribing = false;
  Timer? _clock;
  final ScrollController _chipsController = ScrollController();
  int _lastScrolledIndex = -1;

  double get _duration => _words.isEmpty
      ? 0
      : _words.map((w) => w.endTime).reduce((a, b) => a > b ? a : b);

  int get _currentIndex {
    for (var i = _words.length - 1; i >= 0; i--) {
      if (_position >= _words[i].startTime) return i;
    }
    return 0;
  }

  @override
  void initState() {
    super.initState();
    _words = List.of(widget.project.words);
    _clock = Timer.periodic(const Duration(milliseconds: 100), (_) {
      if (!_playing || !mounted) return;
      setState(() {
        _position += 0.1;
        if (_position >= _duration) {
          _position = _duration;
          _playing = false;
        }
      });
      _maybeAutoScroll();
    });
  }

  @override
  void dispose() {
    _clock?.cancel();
    _chipsController.dispose();
    super.dispose();
  }

  void _maybeAutoScroll() {
    if (!_chipsController.hasClients || _words.isEmpty) return;
    final index = _currentIndex;
    if (index == _lastScrolledIndex) return;
    _lastScrolledIndex = index;
    final target = (index * _chipExtent - 120).clamp(
      0.0,
      _chipsController.position.maxScrollExtent,
    );
    _chipsController.animateTo(
      target,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOut,
    );
  }

  Future<void> _persist() async {
    await context.read<ProjectProvider>().updateWords(widget.project.id, _words);
  }

  Future<void> _transcribe() async {
    final path = widget.project.mediaPath;
    if (path == null || _transcribing) return;
    setState(() => _transcribing = true);
    try {
      final words = await MockTranscriptionService()
          .transcribe(path, language: widget.project.languageCode);
      if (!mounted) return;
      setState(() {
        _words = words;
        _position = 0;
      });
      await _persist();
    } finally {
      if (mounted) setState(() => _transcribing = false);
    }
  }

  void _togglePlay() {
    if (_words.isEmpty) return;
    setState(() {
      if (_position >= _duration) _position = 0;
      _playing = !_playing;
    });
  }

  Future<void> _editWord(CaptionWord word, int index) async {
    final textController = TextEditingController(text: word.text);
    double start = word.startTime;
    double end = word.endTime;
    final max = _duration <= 0 ? 60.0 : _duration;

    final action = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheet) => Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 16,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Edit word',
                  style: GoogleFonts.inter(
                      fontSize: 16, fontWeight: FontWeight.w700)),
              const SizedBox(height: 12),
              TextField(
                controller: textController,
                decoration: const InputDecoration(labelText: 'Text'),
              ),
              const SizedBox(height: 8),
              Text('Start: ${start.toStringAsFixed(2)}s',
                  style: const TextStyle(color: AppTheme.textSecondary)),
              Slider(
                value: start.clamp(0, max),
                max: max,
                activeColor: AppTheme.primary,
                onChanged: (v) => setSheet(() {
                  start = v;
                  if (end < start) end = start + 0.1;
                }),
              ),
              Text('End: ${end.toStringAsFixed(2)}s',
                  style: const TextStyle(color: AppTheme.textSecondary)),
              Slider(
                value: end.clamp(0, max),
                max: max,
                activeColor: AppTheme.primary,
                onChanged: (v) => setSheet(() {
                  end = v;
                  if (start > end) start = (end - 0.1).clamp(0, max);
                }),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => Navigator.of(ctx).pop('delete'),
                      icon: const Icon(Icons.delete_outline_rounded),
                      label: const Text('Delete'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppTheme.error,
                        side: const BorderSide(color: AppTheme.error),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => Navigator.of(ctx).pop('save'),
                      child: const Text('Save'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );

    final newText = textController.text.trim();
    textController.dispose();
    if (action == null) return;
    setState(() {
      if (action == 'delete') {
        _words.removeAt(index);
      } else {
        _words[index] = word.copyWith(
          text: newText.isEmpty ? word.text : newText,
          startTime: start,
          endTime: end,
        );
        _words.sort((a, b) => a.startTime.compareTo(b.startTime));
      }
    });
    await _persist();
  }

  void _addWord() {
    final start = _duration;
    setState(() {
      _words.add(CaptionWord(
        id: _uuid.v4(),
        text: 'new',
        startTime: start,
        endTime: start + 0.6,
      ));
    });
    _persist();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.project.name),
        actions: [
          if (_words.isNotEmpty)
            TextButton.icon(
              onPressed: () => Navigator.of(context).pushNamed(
                ExportScreen.routeName,
                arguments: context
                    .read<ProjectProvider>()
                    .byId(widget.project.id),
              ),
              icon: const Icon(Icons.ios_share_rounded, size: 18),
              label: const Text('Export'),
            ),
        ],
      ),
      floatingActionButton: _words.isEmpty
          ? null
          : FloatingActionButton(
              onPressed: _addWord,
              backgroundColor: AppTheme.primary,
              foregroundColor: Colors.black,
              child: const Icon(Icons.add_rounded),
            ),
      body: _words.isEmpty ? _buildEmpty() : _buildEditor(),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.closed_caption_off_rounded,
                size: 64, color: AppTheme.textSecondary),
            const SizedBox(height: 16),
            Text(
              'No captions yet',
              style: GoogleFonts.inter(
                  fontSize: 18, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            const Text(
              'Transcribe your media to get word-level timings you can edit here.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: _transcribing ? null : _transcribe,
              icon: const Icon(Icons.auto_awesome_rounded),
              label: Text(_transcribing ? 'Transcribing…' : 'Transcribe now'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEditor() {
    final current = _currentIndex;
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
          child: Row(
            children: [
              IconButton.filled(
                onPressed: _togglePlay,
                icon: Icon(_playing
                    ? Icons.pause_rounded
                    : Icons.play_arrow_rounded),
              ),
              const SizedBox(width: 12),
              Text(
                '${_position.toStringAsFixed(1)}s / ${_duration.toStringAsFixed(1)}s',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: AppTheme.textSecondary,
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
              ),
              const Spacer(),
              Text('${_words.length} words',
                  style: const TextStyle(color: AppTheme.textSecondary)),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          child: TimelineRuler(duration: _duration, position: _position),
        ),
        const Divider(height: 1),
        Expanded(
          child: ListView.builder(
            controller: _chipsController,
            scrollDirection: Axis.horizontal,
            itemExtent: _chipExtent,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
            itemCount: _words.length,
            itemBuilder: (context, i) {
              final word = _words[i];
              final active = i == current && _playing;
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: InkWell(
                  borderRadius: BorderRadius.circular(14),
                  onTap: () => _editWord(word, i),
                  child: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: active
                          ? AppTheme.primary.withOpacity(0.2)
                          : AppTheme.card,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: active
                            ? AppTheme.primary
                            : Colors.white.withOpacity(0.08),
                        width: active ? 1.5 : 1,
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          word.text,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight:
                                active ? FontWeight.w700 : FontWeight.w500,
                            color: active
                                ? AppTheme.primary
                                : Colors.white,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          '${word.startTime.toStringAsFixed(1)}–${word.endTime.toStringAsFixed(1)}s',
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            color: AppTheme.textSecondary,
                            fontFeatures: const [
                              FontFeature.tabularFigures()
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
          child: Text(
            'Tap a word to edit its text and timing · changes save automatically',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
                fontSize: 12, color: AppTheme.textSecondary),
          ),
        ),
      ],
    );
  }
}
