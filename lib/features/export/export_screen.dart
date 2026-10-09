import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../shared/models/caption_style.dart';
import '../../shared/models/project.dart';
import '../home/project_provider.dart';
import '../kinetic/kinetic_preview.dart';
import '../kinetic/kinetic_styles.dart';
import '../../services/video/export_service.dart';

/// Export hub: pick a kinetic style, choose resolution, burn captions in.
class ExportScreen extends StatefulWidget {
  static const routeName = '/export';

  final Project project;

  const ExportScreen({super.key, required this.project});

  @override
  State<ExportScreen> createState() => _ExportScreenState();
}

class _ExportScreenState extends State<ExportScreen> {
  final ExportService _exportService = ExportService();
  late KineticPreset _preset;
  int _height = 720; // 720p or 1080p
  bool _exporting = false;
  double _progress = 0;
  String? _outputPath;
  String? _srtPath;
  String? _error;

  @override
  void initState() {
    super.initState();
    _preset = KineticPresets.all.first;
  }

  Project get _project =>
      context.read<ProjectProvider>().byId(widget.project.id) ??
      widget.project;

  CaptionStyle get _captionStyle => CaptionStyle(
        id: _preset.id,
        name: _preset.name,
        previewText: '',
        textColor: _preset.textColor,
        highlightColor: _preset.highlightColor,
        backgroundColor: _preset.backgroundColor,
        fontSize: _height == 1080 ? 64 : 48,
        fontWeight: FontWeight.w800,
        animation: _preset.animation,
      );

  Future<void> _export() async {
    final project = _project;
    if (project.words.isEmpty || _exporting) return;
    setState(() {
      _exporting = true;
      _progress = 0;
      _outputPath = null;
      _srtPath = null;
      _error = null;
    });

    try {
      final stamp = DateTime.now().millisecondsSinceEpoch;
      final srtFile = await _exportService.writeTempFile(
        'captions_$stamp.srt',
        _exportService.buildSrt(project.words),
      );
      if (!mounted) return;
      setState(() => _srtPath = srtFile.path);

      final isVideo =
          project.mediaType == 'video' && project.mediaPath != null;

      if (isVideo) {
        final width = _height == 1080 ? 1920 : 1280;
        final duration = project.duration ??
            project.words.last.endTime;
        final out = await _exportService.burnIn(
          inputPath: project.mediaPath!,
          words: project.words,
          style: _captionStyle,
          mediaDurationSeconds: duration <= 0 ? 1 : duration,
          width: width,
          height: _height,
          onProgress: (p) {
            if (mounted) setState(() => _progress = p);
          },
        );
        if (!mounted) return;
        setState(() => _outputPath = out);
      } else {
        // Audio projects: produce sidecar subtitle files.
        final assFile = await _exportService.writeTempFile(
          'captions_$stamp.ass',
          _exportService.buildAss(project.words, _captionStyle),
        );
        if (!mounted) return;
        setState(() {
          _outputPath = assFile.path;
          _progress = 1.0;
        });
      }

      // Remember the chosen style on the project.
      await context
          .read<ProjectProvider>()
          .updateProject(project.copyWith(styleId: _preset.id));
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _exporting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final project = _project;
    return Scaffold(
      appBar: AppBar(title: const Text('Export')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            KineticPreview(words: project.words, preset: _preset),
            const SizedBox(height: 16),
            _label('STYLE'),
            const SizedBox(height: 8),
            SizedBox(
              height: 44,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: KineticPresets.all.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, i) {
                  final preset = KineticPresets.all[i];
                  final selected = preset.id == _preset.id;
                  return ChoiceChip(
                    label: Text(preset.name),
                    selected: selected,
                    selectedColor: AppTheme.primary.withOpacity(0.25),
                    backgroundColor: AppTheme.card,
                    labelStyle: GoogleFonts.inter(
                      color: selected ? AppTheme.primary : Colors.white,
                      fontWeight:
                          selected ? FontWeight.w700 : FontWeight.w500,
                    ),
                    side: BorderSide(
                      color: selected
                          ? AppTheme.primary
                          : Colors.white.withOpacity(0.1),
                    ),
                    onSelected: (_) => setState(() => _preset = preset),
                  );
                },
              ),
            ),
            Text(
              _preset.description,
              style: GoogleFonts.inter(
                  fontSize: 12, color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 20),
            _label('RESOLUTION'),
            const SizedBox(height: 8),
            SegmentedButton<int>(
              segments: const [
                ButtonSegment(value: 720, label: Text('720p')),
                ButtonSegment(value: 1080, label: Text('1080p')),
              ],
              selected: {_height},
              onSelectionChanged: (s) => setState(() => _height = s.first),
              style: SegmentedButton.styleFrom(
                selectedBackgroundColor:
                    AppTheme.primary.withOpacity(0.25),
                selectedForegroundColor: AppTheme.primary,
              ),
            ),
            const SizedBox(height: 24),
            if (_exporting) ...[
              LinearProgressIndicator(
                value: _progress <= 0 ? null : _progress,
                backgroundColor: AppTheme.surfaceLight,
                color: AppTheme.primary,
                minHeight: 8,
                borderRadius: BorderRadius.circular(4),
              ),
              const SizedBox(height: 8),
              Text(
                'Burning captions… ${(_progress * 100).toStringAsFixed(0)}%',
                style: const TextStyle(color: AppTheme.textSecondary),
              ),
              const SizedBox(height: 16),
            ],
            if (_error != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.error.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(_error!,
                    style: const TextStyle(color: AppTheme.error)),
              ),
              const SizedBox(height: 16),
            ],
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _exporting ? null : _export,
                icon: const Icon(Icons.ios_share_rounded),
                label: Text(
                  project.mediaType == 'video'
                      ? 'Export video with burned-in captions'
                      : 'Export subtitle files (.srt + .ass)',
                ),
              ),
            ),
            if (_outputPath != null || _srtPath != null) ...[
              const SizedBox(height: 20),
              _label('OUTPUT FILES'),
              const SizedBox(height: 8),
              if (_outputPath != null)
                _fileRow('Video / subtitles', _outputPath!),
              if (_srtPath != null) _fileRow('SRT sidecar', _srtPath!),
            ],
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _label(String text) => Text(
        text,
        style: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: AppTheme.textSecondary,
          letterSpacing: 1.2,
        ),
      );

  Widget _fileRow(String title, String path) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          const Icon(Icons.check_circle_rounded, color: AppTheme.success),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                SelectableText(
                  path,
                  style: GoogleFonts.inter(
                      fontSize: 11, color: AppTheme.textSecondary),
                ),
              ],
            ),
          ),
          IconButton(
            tooltip: 'Copy path',
            icon: const Icon(Icons.copy_rounded, size: 18),
            onPressed: () {
              Clipboard.setData(ClipboardData(text: path));
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Path copied')),
              );
            },
          ),
        ],
      ),
    );
  }
}
