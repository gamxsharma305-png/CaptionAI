import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';

import '../../shared/models/caption_word.dart';
import '../../shared/models/media_file.dart';
import '../../shared/models/project.dart';
import '../../services/storage/project_storage.dart';

/// App-wide project state: load, create, update, rename, delete.
class ProjectProvider extends ChangeNotifier {
  static const _uuid = Uuid();

  final ProjectStorage _storage = ProjectStorage();
  List<Project> _projects = [];
  bool _loaded = false;

  List<Project> get projects => List.unmodifiable(_projects);
  bool get isLoaded => _loaded;

  /// Newest first.
  List<Project> get recent =>
      [..._projects]..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));

  Future<void> load() async {
    _projects = await _storage.load();
    _loaded = true;
    notifyListeners();
  }

  Future<void> _persist() => _storage.save(_projects);

  Project createProject({
    required String name,
    required ProjectType type,
    MediaFile? media,
  }) {
    final now = DateTime.now();
    final project = Project(
      id: _uuid.v4(),
      name: name,
      type: type,
      mediaPath: media?.path,
      mediaType: media?.type.name,
      createdAt: now,
      updatedAt: now,
      duration: media?.durationSeconds,
    );
    _projects.add(project);
    _persist();
    notifyListeners();
    return project;
  }

  Project? byId(String id) {
    try {
      return _projects.firstWhere((p) => p.id == id);
    } catch (_) {
      return null;
    }
  }

  Future<void> updateProject(Project updated) async {
    final index = _projects.indexWhere((p) => p.id == updated.id);
    if (index == -1) return;
    _projects[index] = updated.copyWith(updatedAt: DateTime.now());
    await _persist();
    notifyListeners();
  }

  Future<void> updateWords(String projectId, List<CaptionWord> words) async {
    final project = byId(projectId);
    if (project == null) return;
    await updateProject(project.copyWith(words: words));
  }

  Future<void> renameProject(String projectId, String name) async {
    final project = byId(projectId);
    if (project == null || name.trim().isEmpty) return;
    await updateProject(project.copyWith(name: name.trim()));
  }

  Future<void> deleteProject(String projectId) async {
    _projects.removeWhere((p) => p.id == projectId);
    await _persist();
    notifyListeners();
  }
}
