import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../core/constants/app_constants.dart';
import '../../shared/models/project.dart';
import '../player/player_screen.dart';
import 'project_provider.dart';
import 'widgets/home_widgets.dart';
import 'widgets/new_project_sheet.dart';

class HomeScreen extends StatelessWidget {
  static const routeName = '/home';

  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _chooseProjectType(context),
        backgroundColor: AppTheme.primary,
        foregroundColor: Colors.black,
        icon: const Icon(Icons.add_rounded),
        label: Text(
          'New Project',
          style: GoogleFonts.inter(fontWeight: FontWeight.w700),
        ),
      ),
      body: SafeArea(
        child: Consumer<ProjectProvider>(
          builder: (context, provider, _) {
            if (!provider.isLoaded) {
              return const Center(
                child: CircularProgressIndicator(color: AppTheme.primary),
              );
            }
            final projects = provider.recent;
            return SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildHeader(),
                  if (projects.isEmpty) ...[
                    const SizedBox(height: 8),
                    const KineticHero(),
                    Text(
                      'Turn any video or audio into viral kinetic text — or get '
                      'word-perfect auto captions in one tap.',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 28),
                  ] else ...[
                    const SizedBox(height: 24),
                    _sectionLabel('RECENT PROJECTS'),
                    const SizedBox(height: 12),
                    ...projects.map(
                      (p) => ProjectCard(
                        project: p,
                        onOpen: () => Navigator.of(context)
                            .pushNamed(PlayerScreen.routeName, arguments: p),
                        onRename: () => _renameDialog(context, provider, p),
                        onDelete: () => _deleteDialog(context, provider, p),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                  _FeatureCard(
                    title: 'Kinetic Typography',
                    subtitle: 'Get Viral Animated Text Videos',
                    tags: const ['Any audio', '18 languages', '14 styles'],
                    buttonText: 'Start →',
                    buttonColor: AppTheme.primary,
                    onTap: () => NewProjectSheet.show(context, ProjectType.kinetic),
                  ),
                  const SizedBox(height: 16),
                  _FeatureCard(
                    title: 'Auto Captions',
                    subtitle: 'Get Premium Captions In a Single Click',
                    tags: const ['MP4 · MOV', 'Word-perfect', 'Burned in'],
                    buttonText: 'Caption →',
                    buttonColor: const Color(0xFF42A5F5),
                    onTap: () => NewProjectSheet.show(context, ProjectType.autoCaptions),
                  ),
                  const SizedBox(height: 40),
                  _sectionLabel('TOOLKIT'),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Expanded(
                        child: _ToolkitItem(
                          icon: Icons.audiotrack_rounded,
                          title: 'Audio Editor',
                          subtitle: 'Trim · merge · convert',
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: _ToolkitItem(
                          icon: Icons.auto_fix_high_rounded,
                          title: 'Bg Remover',
                          subtitle: 'Image & video',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 96), // space for FAB
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  void _chooseProjectType(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.text_fields_rounded, color: AppTheme.primary),
                title: const Text('Kinetic Typography'),
                subtitle: const Text('Animated text video from audio'),
                onTap: () {
                  Navigator.of(sheetContext).pop();
                  NewProjectSheet.show(context, ProjectType.kinetic);
                },
              ),
              ListTile(
                leading: const Icon(Icons.closed_caption_rounded, color: Color(0xFF42A5F5)),
                title: const Text('Auto Captions'),
                subtitle: const Text('Word-perfect captions for video'),
                onTap: () {
                  Navigator.of(sheetContext).pop();
                  NewProjectSheet.show(context, ProjectType.autoCaptions);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _renameDialog(
      BuildContext context, ProjectProvider provider, Project project) async {
    final controller = TextEditingController(text: project.name);
    final result = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surface,
        title: const Text('Rename project'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(hintText: 'Project name'),
          onSubmitted: (_) => Navigator.of(ctx).pop(controller.text),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(controller.text),
            child: const Text('Save'),
          ),
        ],
      ),
    );
    if (result != null && result.trim().isNotEmpty) {
      await provider.renameProject(project.id, result);
    }
    controller.dispose();
  }

  Future<void> _deleteDialog(
      BuildContext context, ProjectProvider provider, Project project) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surface,
        title: const Text('Delete project?'),
        content: Text('“${project.name}” will be permanently removed.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: TextButton.styleFrom(foregroundColor: AppTheme.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirm == true) {
      await provider.deleteProject(project.id);
    }
  }

  Widget _sectionLabel(String text) {
    return Text(
      text,
      style: GoogleFonts.inter(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        color: AppTheme.textSecondary,
        letterSpacing: 1.2,
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Caption',
              style: GoogleFonts.inter(
                fontSize: 28,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
            Text(
              'AI',
              style: GoogleFonts.inter(
                fontSize: 28,
                fontWeight: FontWeight.w700,
                color: AppTheme.primary,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          AppConstants.appTagline,
          style: GoogleFonts.inter(
            fontSize: 13,
            color: AppTheme.textSecondary,
          ),
        ),
      ],
    );
  }
}

class _FeatureCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final List<String> tags;
  final String buttonText;
  final Color buttonColor;
  final VoidCallback onTap;

  const _FeatureCard({
    required this.title,
    required this.subtitle,
    required this.tags,
    required this.buttonText,
    required this.buttonColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: buttonColor,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                title,
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: GoogleFonts.inter(
              fontSize: 14,
              color: AppTheme.textSecondary,
            ),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: tags.map((tag) {
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceLight,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  tag,
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    color: AppTheme.textSecondary,
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: onTap,
              style: ElevatedButton.styleFrom(
                backgroundColor: buttonColor,
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text(
                buttonText,
                style: GoogleFonts.inter(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ToolkitItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;

  const _ToolkitItem({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppTheme.primary, size: 28),
          const SizedBox(height: 12),
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: GoogleFonts.inter(
              fontSize: 11,
              color: AppTheme.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
