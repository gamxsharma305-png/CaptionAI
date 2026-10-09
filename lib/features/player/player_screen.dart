import 'dart:io';

import 'package:chewie/chewie.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:video_player/video_player.dart';

import '../../core/theme/app_theme.dart';
import '../../shared/models/project.dart';
import '../editor/editor_screen.dart';
import '../export/export_screen.dart';
import '../home/project_provider.dart';
import '../../services/transcription/mock_transcription_service.dart';
import '../../services/transcription/whisper_transcription_service.dart';

/// Plays the project's media and is the hub for transcribe → edit → export.
class PlayerScreen extends StatefulWidget {
  static const routeName = '/player';

  final Project project;

  const PlayerScreen({super.key, required this.project});

  @override
  State<PlayerScreen> createState() => _PlayerScreenState();
}

class _PlayerScreenState extends State<PlayerScreen> {
  VideoPlayerController? _videoController;
  ChewieController? _chewieController;
  bool _transcribing = false;
  late Project _project;

  bool get _isVideo =>
      _project.mediaType == 'video' && _project.mediaPath != null;

  @override
  void initState() {
    super.initState();
    _project = widget.project;
    if (_project.mediaPath != null) {
      _videoController =
          VideoPlayerController.file(File(_project.mediaPath!));
      if (_isVideo) {
        _videoController!.initialize().then((_) {
          if (!mounted) return;
          setState(() {
            _chewieController = ChewieController(
              videoPlayerController: _videoController!,
              autoPlay: false,
              looping: false,
              aspectRatio: _videoController!.value.aspectRatio == 0
                  ? 16 / 9
                  : _videoController!.value.aspectRatio,
              placeholder: Container(color: AppTheme.surfaceLight),
            );
          });
        });
      } else {
        _videoController!.initialize().then((_) {
          if (mounted) setState(() {});
        });
      }
    }
  }

  @override
  void dispose() {
    _chewieController?.dispose();
    _videoController?.dispose();
    super.dispose();
  }

  Future<void> _transcribe() async {
    if (_project.mediaPath == null || _transcribing) return;
    setState(() => _transcribing = true);
    try {
      final whisper = WhisperTranscriptionService();
      final service = whisper.isConfigured
          ? whisper
          : MockTranscriptionService();
      final words = await service.transcribe(
        _project.mediaPath!,
        language: _project.languageCode,
      );
      if (!mounted) return;
      await context.read<ProjectProvider>().updateWords(_project.id, words);
      final updated = context.read<ProjectProvider>().byId(_project.id);
      if (updated != null) setState(() => _project = updated);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            whisper.isConfigured
                ? 'Transcribed ${words.length} words with Whisper'
                : 'Demo transcription ready — ${words.length} words',
          ),
        ),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Transcription failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _transcribing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_project.name)),
      body: Column(
        children: [
          Expanded(child: _buildMediaArea()),
          _buildActionBar(),
        ],
      ),
    );
  }

  Widget _buildMediaArea() {
    if (_project.mediaPath == null) {
      return const Center(child: Text('No media attached to this project'));
    }
    if (_isVideo) {
      if (_chewieController == null) {
        return const Center(
          child: CircularProgressIndicator(color: AppTheme.primary),
        );
      }
      return Chewie(controller: _chewieController!);
    }
    return _buildAudioUi();
  }

  Widget _buildAudioUi() {
    final controller = _videoController;
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 180,
            height: 180,
            decoration: BoxDecoration(
              color: AppTheme.surfaceLight,
              borderRadius: BorderRadius.circular(32),
            ),
            child: const Icon(
              Icons.graphic_eq_rounded,
              size: 80,
              color: AppTheme.primary,
            ),
          ),
          const SizedBox(height: 24),
          if (controller == null)
            const CircularProgressIndicator(color: AppTheme.primary)
          else
            ValueListenableBuilder(
              valueListenable: controller,
              builder: (context, value, _) {
                final position = value.position;
                final duration = value.duration;
                return Column(
                  children: [
                    Slider(
                      value: duration.inMilliseconds == 0
                          ? 0
                          : position.inMilliseconds
                              .clamp(0, duration.inMilliseconds)
                              .toDouble(),
                      max: duration.inMilliseconds <= 0
                          ? 1.0
                          : duration.inMilliseconds.toDouble(),
                      activeColor: AppTheme.primary,
                      onChanged: (v) => controller
                          .seekTo(Duration(milliseconds: v.round())),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(_fmt(position),
                            style: const TextStyle(color: AppTheme.textSecondary)),
                        Text(_fmt(duration),
                            style: const TextStyle(color: AppTheme.textSecondary)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    IconButton.filled(
                      onPressed: () => value.isPlaying
                          ? controller.pause()
                          : controller.play(),
                      iconSize: 36,
                      icon: Icon(
                        value.isPlaying
                            ? Icons.pause_rounded
                            : Icons.play_arrow_rounded,
                      ),
                    ),
                  ],
                );
              },
            ),
        ],
      ),
    );
  }

  Widget _buildActionBar() {
    final hasWords = _project.words.isNotEmpty;
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
      decoration: const BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            hasWords
                ? '${_project.words.length} words transcribed'
                : 'No captions yet — transcribe to begin',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 13,
              color: AppTheme.textSecondary,
            ),
          ),
          const SizedBox(height: 12),
          ElevatedButton.icon(
            onPressed: _transcribing ? null : _transcribe,
            icon: _transcribing
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.black,
                    ),
                  )
                : const Icon(Icons.auto_awesome_rounded),
            label: Text(_transcribing ? 'Transcribing…' : 'Auto Transcribe'),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: hasWords
                      ? () => Navigator.of(context).pushNamed(
                            EditorScreen.routeName,
                            arguments: _project,
                          )
                      : null,
                  icon: const Icon(Icons.edit_rounded),
                  label: const Text('Edit'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: hasWords
                      ? () => Navigator.of(context).pushNamed(
                            ExportScreen.routeName,
                            arguments: _project,
                          )
                      : null,
                  icon: const Icon(Icons.ios_share_rounded),
                  label: const Text('Export'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _fmt(Duration d) {
    final m = d.inMinutes;
    final s = d.inSeconds % 60;
    return '$m:${s.toString().padLeft(2, '0')}';
  }
}
