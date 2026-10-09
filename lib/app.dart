import 'package:flutter/material.dart';

import 'core/theme/app_theme.dart';
import 'features/editor/editor_screen.dart';
import 'features/export/export_screen.dart';
import 'features/home/home_screen.dart';
import 'features/player/player_screen.dart';
import 'shared/models/project.dart';

class CaptionAIApp extends StatelessWidget {
  const CaptionAIApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CaptionAI',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      initialRoute: HomeScreen.routeName,
      routes: {
        HomeScreen.routeName: (_) => const HomeScreen(),
      },
      onGenerateRoute: (settings) {
        final args = settings.arguments;
        switch (settings.name) {
          case PlayerScreen.routeName:
            if (args is Project) {
              return MaterialPageRoute(
                builder: (_) => PlayerScreen(project: args),
                settings: settings,
              );
            }
            break;
          case EditorScreen.routeName:
            if (args is Project) {
              return MaterialPageRoute(
                builder: (_) => EditorScreen(project: args),
                settings: settings,
              );
            }
            break;
          case ExportScreen.routeName:
            if (args is Project) {
              return MaterialPageRoute(
                builder: (_) => ExportScreen(project: args),
                settings: settings,
              );
            }
            break;
        }
        // Unknown route or missing arguments — fall back to home.
        return MaterialPageRoute(builder: (_) => const HomeScreen());
      },
    );
  }
}
