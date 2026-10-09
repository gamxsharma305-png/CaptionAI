import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../../shared/models/project.dart';

/// Persists the project list as JSON in SharedPreferences.
class ProjectStorage {
  static const _key = 'captionai_projects_v1';

  Future<List<Project>> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null || raw.isEmpty) return [];
    try {
      final list = jsonDecode(raw) as List<dynamic>;
      return list
          .map((e) => Project.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
    } catch (_) {
      // Corrupted cache — start fresh rather than crash.
      return [];
    }
  }

  Future<void> save(List<Project> projects) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = jsonEncode(projects.map((p) => p.toJson()).toList());
    await prefs.setString(_key, raw);
  }

  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}
