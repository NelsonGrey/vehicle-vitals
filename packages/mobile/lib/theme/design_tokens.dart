import 'package:flutter/material.dart';

/// Design tokens that mirror the web Tailwind configuration
class AppDesignTokens {
  // Slate/teal palette matching the web app style.
  static const slate50 = Color(0xFFF8FAFC);
  static const slate100 = Color(0xFFF1F5F9);
  static const slate200 = Color(0xFFE2E8F0);
  static const slate300 = Color(0xFFCBD5E1);
  static const slate400 = Color(0xFF94A3B8);
  static const slate500 = Color(0xFF64748B);
  static const slate700 = Color(0xFF334155);
  static const slate800 = Color(0xFF1E293B);
  static const slate900 = Color(0xFF0F172A);
  static const teal700 = Color(0xFF0F766E);
  static const danger = Color(0xFFB42318);

  // Spacing scale (4px base)
  static const space1 = 4.0;
  static const space2 = 8.0;
  static const space3 = 12.0;
  static const space4 = 16.0;
  static const space5 = 20.0;
  static const space6 = 24.0;
  static const space8 = 32.0;
  static const space10 = 40.0;
  static const space12 = 48.0;
  static const space16 = 64.0;
  static const space20 = 80.0;

  // Border radius
  static const radiusBase = 8.0;
  static const radiusLg = 12.0;
  static const radiusXl = 16.0;

  // Typography
  static const fontSans = 'Inter';
  static const fontSerif = 'Playfair Display';

  // Get color scheme based on brightness
  static AppColorScheme colorScheme(Brightness brightness) {
    return brightness == Brightness.dark
        ? AppColorScheme.dark()
        : AppColorScheme.light();
  }
}

/// Color scheme that adapts to light/dark mode
class AppColorScheme {
  final Color background;
  final Color surface;
  final Color onBackground;
  final Color onSurface;
  final Color primary;
  final Color onPrimary;
  final Color secondary;
  final Color onSecondary;
  final Color border;
  final Color muted;

  const AppColorScheme({
    required this.background,
    required this.surface,
    required this.onBackground,
    required this.onSurface,
    required this.primary,
    required this.onPrimary,
    required this.secondary,
    required this.onSecondary,
    required this.border,
    required this.muted,
  });

  factory AppColorScheme.light() => const AppColorScheme(
    background: AppDesignTokens.slate50,
    surface: Colors.white,
    onBackground: AppDesignTokens.slate900,
    onSurface: AppDesignTokens.slate900,
    primary: AppDesignTokens.slate700,
    onPrimary: Colors.white,
    secondary: AppDesignTokens.teal700,
    onSecondary: Colors.white,
    border: AppDesignTokens.slate200,
    muted: AppDesignTokens.slate500,
  );

  factory AppColorScheme.dark() => const AppColorScheme(
    background: AppDesignTokens.slate900,
    surface: AppDesignTokens.slate800,
    onBackground: AppDesignTokens.slate50,
    onSurface: AppDesignTokens.slate50,
    primary: AppDesignTokens.slate300,
    onPrimary: AppDesignTokens.slate900,
    secondary: Color(0xFF2DD4BF),
    onSecondary: AppDesignTokens.slate900,
    border: AppDesignTokens.slate700,
    muted: AppDesignTokens.slate400,
  );
}
