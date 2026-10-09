import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_theme.dart';
import '../../../shared/models/project.dart';

/// Hand-rolled kinetic typography hero — no extra dependencies.
///
/// Cycles through punchy phrases with a scale+fade entrance, like the
/// animated text in the KineCut app this project is inspired by.
class KineticHero extends StatefulWidget {
  const KineticHero({super.key});

  static const _phrases = [
    'WORDS THAT MOVE',
    'CAPTIONS IN ONE TAP',
    'MADE TO GO VIRAL',
  ];

  @override
  State<KineticHero> createState() => _KineticHeroState();
}

class _KineticHeroState extends State<KineticHero>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scale;
  late final Animation<double> _fade;
  int _index = 0;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _scale = Tween<double>(begin: 0.7, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.elasticOut),
    );
    _fade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );
    _controller.forward();
    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        Future<void>.delayed(const Duration(seconds: 2), () {
          if (!mounted) return;
          setState(() => _index = (_index + 1) % KineticHero._phrases.length);
          _controller.forward(from: 0);
        });
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 150,
      child: Center(
        child: AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            return Opacity(
              opacity: _fade.value,
              child: Transform.scale(
                scale: _scale.value,
                child: child,
              ),
            );
          },
          child: Text(
            KineticHero._phrases[_index],
            key: ValueKey<int>(_index),
            textAlign: TextAlign.center,
            style: GoogleFonts.bebasNeue(
              fontSize: 44,
              height: 1.05,
              color: Colors.white,
              letterSpacing: 1.5,
            ),
          ),
        ),
      ),
    );
  }
}

/// Card for a single project in the home list.
class ProjectCard extends StatelessWidget {
  final Project project;
  final VoidCallback onOpen;
  final VoidCallback onRename;
  final VoidCallback onDelete;

  const ProjectCard({
    super.key,
    required this.project,
    required this.onOpen,
    required this.onRename,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final date = DateFormat('dd MMM yyyy, HH:mm').format(project.updatedAt);
    final isVideo = project.mediaType == 'video';

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onOpen,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: AppTheme.surfaceLight,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  isVideo ? Icons.videocam_rounded : Icons.audiotrack_rounded,
                  color: AppTheme.primary,
                  size: 28,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      project.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$date · ${project.words.length} words'
                      '${project.duration != null ? ' · ${_fmtDuration(project.duration!)}' : ''}',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              PopupMenuButton<String>(
                icon: const Icon(Icons.more_vert_rounded, color: AppTheme.textSecondary),
                color: AppTheme.surfaceLight,
                onSelected: (value) {
                  if (value == 'rename') onRename();
                  if (value == 'delete') onDelete();
                },
                itemBuilder: (context) => const [
                  PopupMenuItem(value: 'rename', child: Text('Rename')),
                  PopupMenuItem(value: 'delete', child: Text('Delete')),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _fmtDuration(double seconds) {
    final d = Duration(seconds: seconds.round());
    final m = d.inMinutes;
    final s = d.inSeconds % 60;
    return '$m:${s.toString().padLeft(2, '0')}';
  }
}
