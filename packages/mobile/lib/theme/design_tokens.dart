import 'package:flutter/material.dart';

/// Design tokens that mirror the web Tailwind configuration
class AppDesignTokens {
  // Color palette matching web Tailwind config
  static const cream = Color(0xFFFFFAF3);
  static const charcoal = Color(0xFF2B2B2B);
  static const warmGray = Color(0xFF7A6F66);
  static const parchment = Color(0xFFFFF6E6);
  static const tan = Color(0xFFE8DECF);
  static const oxblood = Color(0xFF8B1E2B);
  static const primaryContrast = Color(0xFFFFF9F4);
  static const forest = Color(0xFF0B5D3B);
  static const gold = Color(0xFFB68C2C);
  static const danger = Color(0xFFB42318);

  // Dark mode colors
  static const deepBrown = Color(0xFF14110F);
  static const lightCream = Color(0xFFF3EFE7);
  static const lightGray = Color(0xFFC9C3B8);
  static const darkCard = Color(0xFF1D1916);
  static const darkBorder = Color(0xFF2B2622);
  static const rust = Color(0xFFE07A5F);
  static const mintGreen = Color(0xFF81B29A);
  static const lightGold = Color(0xFFF2CC8F);

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
    background: AppDesignTokens.cream,
    surface: AppDesignTokens.parchment,
    onBackground: AppDesignTokens.charcoal,
    onSurface: AppDesignTokens.charcoal,
    primary: AppDesignTokens.oxblood,
    onPrimary: AppDesignTokens.primaryContrast,
    secondary: AppDesignTokens.forest,
    onSecondary: Colors.white,
    border: AppDesignTokens.tan,
    muted: AppDesignTokens.warmGray,
  );

  factory AppColorScheme.dark() => const AppColorScheme(
    background: AppDesignTokens.deepBrown,
    surface: AppDesignTokens.darkCard,
    onBackground: AppDesignTokens.lightCream,
    onSurface: AppDesignTokens.lightCream,
    primary: AppDesignTokens.rust,
    onPrimary: AppDesignTokens.deepBrown,
    secondary: AppDesignTokens.mintGreen,
    onSecondary: AppDesignTokens.deepBrown,
    border: AppDesignTokens.darkBorder,
    muted: AppDesignTokens.lightGray,
  );
}
