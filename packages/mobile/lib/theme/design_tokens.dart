import 'package:flutter/material.dart';

import 'palettes.dart';

/// Design tokens that mirror the web Tailwind configuration
class AppDesignTokens {
  // Fixed dark-mode structure (background/surface/border/text) shared by
  // every palette -- see AppColorScheme.dark. Light mode instead pulls
  // these from the active PaletteDefinition, so each palette gets its own
  // distinct light-mode look.
  static const slate50 = Color(0xFFF8FAFC);
  static const slate100 = Color(0xFFF1F5F9);
  static const slate300 = Color(0xFFCBD5E1);
  static const slate400 = Color(0xFF94A3B8);
  static const slate700 = Color(0xFF334155);
  static const slate800 = Color(0xFF1E293B);
  static const slate900 = Color(0xFF0F172A);
  // Fixed dark-mode accent (NOT palette-aware -- see AppColorScheme.dark's
  // doc comment for why primary/secondary can't safely vary by palette in
  // dark mode).
  static const blue400 = Color(0xFF60A5FA);

  // Semantic status colors, used everywhere the app needs to signal
  // error/warning/success rather than a screen-specific Colors.red/etc.
  // Matches the web app's Tailwind danger/warning/accent .500 shades.
  static const danger = Color(0xFFEF4444);
  static const warning = Color(0xFFF59E0B);
  static const success = Color(0xFF22C55E);
  static const onDanger = Colors.white;
  static const onWarning = Colors.black;
  static const onSuccess = Colors.white;

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

  // Which palette is currently active, app-wide. PaletteService is the only
  // writer -- it updates this (and calls notifyListeners()) together
  // whenever the user changes or loads their palette preference, so every
  // reader below always reflects the current selection. Defaults to the
  // baseline palette so the app still looks right before PaletteService's
  // first read completes.
  static PaletteId currentPaletteId = PaletteId.current;

  // Every screen's AppBar uses this brand color, fixed across light/dark
  // mode within a given palette (so headers read as one consistent brand
  // surface in both, with white text/icons always legible on top) but
  // varying between palettes.
  static Color get headerColor => kPalettes[currentPaletteId]!.header;
  static const headerToolbarHeight = 50.0;

  // Resolve the color scheme for a brightness, optionally for a specific
  // palette -- defaults to the currently active one (currentPaletteId) so
  // existing call sites that only pass brightness stay correct without
  // changes as the active palette changes.
  static AppColorScheme colorScheme(
    Brightness brightness, [
    PaletteId? paletteId,
  ]) {
    final palette = kPalettes[paletteId ?? currentPaletteId]!;
    return brightness == Brightness.dark
        ? AppColorScheme.dark(palette)
        : AppColorScheme.light(palette);
  }
}

/// Color scheme that adapts to light/dark mode and to the active palette.
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

  // Light mode reflects the palette's full look -- background, surface,
  // border, and text all come from the palette, so each of the 5 reads as
  // genuinely distinct (not just a different button color).
  factory AppColorScheme.light(PaletteDefinition palette) => AppColorScheme(
    background: palette.bg,
    surface: palette.surface,
    onBackground: palette.text,
    onSurface: palette.text,
    primary: palette.primary,
    onPrimary: Colors.white,
    secondary: palette.brandAccent,
    onSecondary: Colors.white,
    border: palette.border,
    muted: palette.muted,
  );

  // Dark mode keeps the app's ENTIRE pre-palette look fixed across all 5
  // palettes, primary/secondary included -- `palette` is accepted for
  // signature symmetry with .light() but deliberately unused here.
  //
  // primary/secondary were briefly made palette-aware here too (matching
  // AppBarTheme's header, which safely varies -- see below), but a real
  // WCAG contrast audit caught a serious bug that reverted it: `primary`
  // doubles as both a button-background color (paired with white, which is
  // fine -- e.g. white-on-#334155 is 10.35:1) AND a bare heading-text color
  // rendered directly on `background` in AppTheme's textTheme. A color dark
  // enough to work as a button background is, by definition, too dark to
  // read as text on an equally-dark background: measured contrast for
  // primary-on-slate900 ranged from 1.72:1 to 3.45:1 across the 5 palettes
  // (need 4.5:1) -- every palette's headings would have been nearly
  // illegible in dark mode. `secondary` has the same problem at a smaller
  // scale (used as bare text in vehicle_detail_screen.dart's recall count).
  // Untangling the two roles (surface-color vs text-color) would need
  // call-site changes beyond a palette-plumbing pass, so dark mode reverts
  // to exactly its pre-palette values instead. The one exception is
  // AppBarTheme's `palette.header`, used ONLY as a surface paired with a
  // fixed white foreground (verified 5.17:1-20.17:1 across all 5 palettes),
  // which is why headerColor is still allowed to vary above.
  factory AppColorScheme.dark(PaletteDefinition palette) => AppColorScheme(
    background: AppDesignTokens.slate900,
    surface: AppDesignTokens.slate800,
    onBackground: AppDesignTokens.slate50,
    onSurface: AppDesignTokens.slate50,
    primary: AppDesignTokens.slate300,
    onPrimary: AppDesignTokens.slate900,
    secondary: AppDesignTokens.blue400,
    onSecondary: AppDesignTokens.slate900,
    border: AppDesignTokens.slate700,
    muted: AppDesignTokens.slate400,
  );
}
