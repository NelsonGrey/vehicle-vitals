import 'package:flutter/material.dart';
import 'design_tokens.dart';

/// App theme configuration using Tailwind-inspired design tokens
class AppTheme {
  static ThemeData lightTheme() {
    final colors = AppDesignTokens.colorScheme(Brightness.light);

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      fontFamily: AppDesignTokens.fontSans,

      // Color scheme
      colorScheme: ColorScheme.light(
        primary: colors.primary,
        onPrimary: colors.onPrimary,
        secondary: colors.secondary,
        onSecondary: colors.onSecondary,
        surface: colors.surface,
        onSurface: colors.onSurface,
        outline: colors.border,
      ),

      // Scaffold
      scaffoldBackgroundColor: colors.background,

      // App bar
      appBarTheme: AppBarTheme(
        backgroundColor: colors.background,
        foregroundColor: colors.onBackground,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontFamily: AppDesignTokens.fontSerif,
          fontSize: 24,
          fontWeight: FontWeight.w700,
          color: colors.onBackground,
        ),
      ),

      // Card
      cardTheme: CardThemeData(
        color: colors.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppDesignTokens.radiusXl),
          side: BorderSide(color: colors.border),
        ),
        margin: EdgeInsets.zero,
      ),

      // Elevated button
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: colors.primary,
          foregroundColor: colors.onPrimary,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppDesignTokens.radiusLg),
          ),
          padding: const EdgeInsets.symmetric(
            horizontal: AppDesignTokens.space4,
            vertical: AppDesignTokens.space3,
          ),
        ),
      ),

      // Outlined button
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: colors.onBackground,
          side: BorderSide(color: colors.border),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppDesignTokens.radiusLg),
          ),
          padding: const EdgeInsets.symmetric(
            horizontal: AppDesignTokens.space4,
            vertical: AppDesignTokens.space3,
          ),
        ),
      ),

      // Text button
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: colors.primary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppDesignTokens.radiusLg),
          ),
          padding: const EdgeInsets.symmetric(
            horizontal: AppDesignTokens.space4,
            vertical: AppDesignTokens.space3,
          ),
        ),
      ),

      // Input decoration
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: colors.background,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppDesignTokens.radiusLg),
          borderSide: BorderSide(color: colors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppDesignTokens.radiusLg),
          borderSide: BorderSide(color: colors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppDesignTokens.radiusLg),
          borderSide: BorderSide(color: colors.primary, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppDesignTokens.space3,
          vertical: AppDesignTokens.space2 + 2,
        ),
      ),

      // Text theme
      textTheme: TextTheme(
        displayLarge: TextStyle(
          fontFamily: AppDesignTokens.fontSerif,
          fontSize: 48,
          fontWeight: FontWeight.w700,
          color: colors.onBackground,
        ),
        displayMedium: TextStyle(
          fontFamily: AppDesignTokens.fontSerif,
          fontSize: 36,
          fontWeight: FontWeight.w700,
          color: colors.onBackground,
        ),
        displaySmall: TextStyle(
          fontFamily: AppDesignTokens.fontSerif,
          fontSize: 30,
          fontWeight: FontWeight.w600,
          color: colors.onBackground,
        ),
        headlineLarge: TextStyle(
          fontFamily: AppDesignTokens.fontSerif,
          fontSize: 24,
          fontWeight: FontWeight.w600,
          color: colors.onBackground,
        ),
        headlineMedium: TextStyle(
          fontFamily: AppDesignTokens.fontSerif,
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: colors.onBackground,
        ),
        headlineSmall: TextStyle(
          fontFamily: AppDesignTokens.fontSerif,
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: colors.onBackground,
        ),
        bodyLarge: TextStyle(
          fontFamily: AppDesignTokens.fontSans,
          fontSize: 16,
          color: colors.onBackground,
        ),
        bodyMedium: TextStyle(
          fontFamily: AppDesignTokens.fontSans,
          fontSize: 14,
          color: colors.onBackground,
        ),
        bodySmall: TextStyle(
          fontFamily: AppDesignTokens.fontSans,
          fontSize: 12,
          color: colors.muted,
        ),
        labelLarge: TextStyle(
          fontFamily: AppDesignTokens.fontSans,
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: colors.onBackground,
        ),
      ),
    );
  }

  static ThemeData darkTheme() {
    final colors = AppDesignTokens.colorScheme(Brightness.dark);

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      fontFamily: AppDesignTokens.fontSans,

      // Color scheme
      colorScheme: ColorScheme.dark(
        primary: colors.primary,
        onPrimary: colors.onPrimary,
        secondary: colors.secondary,
        onSecondary: colors.onSecondary,
        surface: colors.surface,
        onSurface: colors.onSurface,
        outline: colors.border,
      ),

      // Scaffold
      scaffoldBackgroundColor: colors.background,

      // App bar
      appBarTheme: AppBarTheme(
        backgroundColor: colors.background,
        foregroundColor: colors.onBackground,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontFamily: AppDesignTokens.fontSerif,
          fontSize: 24,
          fontWeight: FontWeight.w700,
          color: colors.onBackground,
        ),
      ),

      // Card
      cardTheme: CardThemeData(
        color: colors.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppDesignTokens.radiusXl),
          side: BorderSide(color: colors.border),
        ),
        margin: EdgeInsets.zero,
      ),

      // Elevated button
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: colors.primary,
          foregroundColor: colors.onPrimary,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppDesignTokens.radiusLg),
          ),
          padding: const EdgeInsets.symmetric(
            horizontal: AppDesignTokens.space4,
            vertical: AppDesignTokens.space3,
          ),
        ),
      ),

      // Outlined button
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: colors.onBackground,
          side: BorderSide(color: colors.border),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppDesignTokens.radiusLg),
          ),
          padding: const EdgeInsets.symmetric(
            horizontal: AppDesignTokens.space4,
            vertical: AppDesignTokens.space3,
          ),
        ),
      ),

      // Text button
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: colors.primary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppDesignTokens.radiusLg),
          ),
          padding: const EdgeInsets.symmetric(
            horizontal: AppDesignTokens.space4,
            vertical: AppDesignTokens.space3,
          ),
        ),
      ),

      // Input decoration
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: colors.background,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppDesignTokens.radiusLg),
          borderSide: BorderSide(color: colors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppDesignTokens.radiusLg),
          borderSide: BorderSide(color: colors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppDesignTokens.radiusLg),
          borderSide: BorderSide(color: colors.primary, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppDesignTokens.space3,
          vertical: AppDesignTokens.space2 + 2,
        ),
      ),

      // Text theme
      textTheme: TextTheme(
        displayLarge: TextStyle(
          fontFamily: AppDesignTokens.fontSerif,
          fontSize: 48,
          fontWeight: FontWeight.w700,
          color: colors.onBackground,
        ),
        displayMedium: TextStyle(
          fontFamily: AppDesignTokens.fontSerif,
          fontSize: 36,
          fontWeight: FontWeight.w700,
          color: colors.onBackground,
        ),
        displaySmall: TextStyle(
          fontFamily: AppDesignTokens.fontSerif,
          fontSize: 30,
          fontWeight: FontWeight.w600,
          color: colors.onBackground,
        ),
        headlineLarge: TextStyle(
          fontFamily: AppDesignTokens.fontSerif,
          fontSize: 24,
          fontWeight: FontWeight.w600,
          color: colors.onBackground,
        ),
        headlineMedium: TextStyle(
          fontFamily: AppDesignTokens.fontSerif,
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: colors.onBackground,
        ),
        headlineSmall: TextStyle(
          fontFamily: AppDesignTokens.fontSerif,
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: colors.onBackground,
        ),
        bodyLarge: TextStyle(
          fontFamily: AppDesignTokens.fontSans,
          fontSize: 16,
          color: colors.onBackground,
        ),
        bodyMedium: TextStyle(
          fontFamily: AppDesignTokens.fontSans,
          fontSize: 14,
          color: colors.onBackground,
        ),
        bodySmall: TextStyle(
          fontFamily: AppDesignTokens.fontSans,
          fontSize: 12,
          color: colors.muted,
        ),
        labelLarge: TextStyle(
          fontFamily: AppDesignTokens.fontSans,
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: colors.onBackground,
        ),
      ),
    );
  }
}
