import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_theme.dart';
import '../../../shared/models/media_file.dart';
import '../../../shared/models/project.dart';
import '../../player/player_screen.dart';
import '../project_provider.dart';
import '../../../services/media/media_picker_service.dart';

/// Bottom sheet shown from "New Project": pick a media source, create the
/// project, then jump straight into the player.
class NewProjectSheet extends StatelessWidget {
  final ProjectType type;

  const NewProjectSheet({super.key, required this.type});

  static Future<void> show(BuildContext context, ProjectType type) {
    return showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => NewProjectSheet(type: type),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              type == ProjectType.kinetic ? 'New Kinetic Video' : 'New Auto Captions',
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Choose a source to start your project',
              style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 20),
            _SourceTile(
              icon: Icons.videocam_rounded,
              title: 'Import video',
              subtitle: 'MP4 · MOV · MKV from gallery or files',
              onTap: () => _pick(context, MediaType.video),
            ),
            const SizedBox(height: 12),
            _SourceTile(
              icon: Icons.audiotrack_rounded,
              title: 'Import audio',
              subtitle: 'MP3 · WAV · M4A for kinetic typography',
              onTap: () => _pick(context, MediaType.audio),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pick(BuildContext context, MediaType mediaType) async {
    final picker = MediaPickerService();
    MediaFile? media;
    try {
      media = mediaType == MediaType.video
          ? await picker.pickVideo()
          : await picker.pickAudio();
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not pick file: $e')),
        );
      }
      return;
    }
    if (media == null) return; // user cancelled or permission denied
    if (!context.mounted) return;

    final provider = context.read<ProjectProvider>();
    final project = provider.createProject(
      name: media.name.replaceAll(RegExp(r'\.[^.]+$'), ''),
      type: type,
      media: media,
    );

    final navigator = Navigator.of(context);
    navigator.pop(); // close sheet
    navigator.pushNamed(PlayerScreen.routeName, arguments: project);
  }
}

class _SourceTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _SourceTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withOpacity(0.06)),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: AppTheme.primary),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: AppTheme.textSecondary),
          ],
        ),
      ),
    );
  }
}
