import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:vehicle_vitals_flutter/theme/app_theme.dart';
import 'package:vehicle_vitals_flutter/theme/design_tokens.dart';
import 'package:vehicle_vitals_flutter/theme/palettes.dart';

// WCAG 2.x relative-luminance contrast ratio, per
// https://www.w3.org/TR/WCAG21/#dfn-relative-luminance -- used below to
// guard against a real regression found 2026-09-14: making `primary` vary
// by palette in dark mode looked reasonable but silently broke heading-text
// legibility (as low as 1.72:1 where normal text needs 4.5:1), because the
// same color served both a button-background role (fine, paired with
// white) and a bare-text-on-background role (not fine) at once.
double _relativeLuminance(Color c) {
  double channel(double v) =>
      v <= 0.03928 ? v / 12.92 : pow((v + 0.055) / 1.055, 2.4).toDouble();
  final r = channel(c.r);
  final g = channel(c.g);
  final b = channel(c.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

double _contrast(Color a, Color b) {
  final la = _relativeLuminance(a);
  final lb = _relativeLuminance(b);
  final lighter = la > lb ? la : lb;
  final darker = la > lb ? lb : la;
  return (lighter + 0.05) / (darker + 0.05);
}

void main() {
  group('palette theming', () {
    for (final id in PaletteId.values) {
      final palette = kPalettes[id]!;

      test('${id.name}: light mode reflects the full palette', () {
        final colors = AppDesignTokens.colorScheme(Brightness.light, id);
        expect(colors.background, palette.bg);
        expect(colors.surface, palette.surface);
        expect(colors.onBackground, palette.text);
        expect(colors.onSurface, palette.text);
        expect(colors.primary, palette.primary);
        expect(colors.secondary, palette.brandAccent);
        expect(colors.border, palette.border);
        expect(colors.muted, palette.muted);
      });

      test('${id.name}: light mode meets WCAG AA (4.5:1) for text colors '
          'rendered directly on background/surface', () {
        final colors = AppDesignTokens.colorScheme(Brightness.light, id);
        expect(
          _contrast(colors.onBackground, colors.background),
          greaterThanOrEqualTo(4.5),
          reason: 'text on background',
        );
        expect(
          _contrast(colors.onSurface, colors.surface),
          greaterThanOrEqualTo(4.5),
          reason: 'text on surface',
        );
        expect(
          _contrast(colors.primary, colors.background),
          greaterThanOrEqualTo(4.5),
          reason: 'primary (headings/links) on background',
        );
        expect(
          _contrast(colors.onPrimary, colors.primary),
          greaterThanOrEqualTo(4.5),
          reason: 'button text on primary',
        );
        expect(
          _contrast(colors.muted, colors.background),
          greaterThanOrEqualTo(4.5),
          reason: 'muted captions on background',
        );
      });

      test('${id.name}: dark mode stays fixed at the pre-palette look '
          '(primary/secondary included -- see AppColorScheme.dark\'s doc '
          'comment: varying them by palette failed a WCAG contrast audit)', () {
        final colors = AppDesignTokens.colorScheme(Brightness.dark, id);
        expect(colors.background, AppDesignTokens.slate900);
        expect(colors.surface, AppDesignTokens.slate800);
        expect(colors.onBackground, AppDesignTokens.slate50);
        expect(colors.onSurface, AppDesignTokens.slate50);
        expect(colors.border, AppDesignTokens.slate700);
        expect(colors.muted, AppDesignTokens.slate400);
        expect(colors.primary, AppDesignTokens.slate300);
        expect(colors.onPrimary, AppDesignTokens.slate900);
        expect(colors.secondary, AppDesignTokens.blue400);
        expect(colors.onSecondary, AppDesignTokens.slate900);
      });

      test('${id.name}: AppBar header color matches the palette in both '
          'brightness modes', () {
        final lightAppBar = AppTheme.lightTheme(id).appBarTheme;
        final darkAppBar = AppTheme.darkTheme(id).appBarTheme;
        expect(lightAppBar.backgroundColor, palette.header);
        expect(darkAppBar.backgroundColor, palette.header);
      });
    }

    test('semantic status colors never vary by palette', () {
      for (final id in PaletteId.values) {
        AppDesignTokens.currentPaletteId = id;
        expect(AppDesignTokens.danger, const Color(0xFFEF4444));
        expect(AppDesignTokens.warning, const Color(0xFFF59E0B));
        expect(AppDesignTokens.success, const Color(0xFF22C55E));
      }
      AppDesignTokens.currentPaletteId = PaletteId.current;
    });

    test(
      'colorScheme() without an explicit palette follows currentPaletteId',
      () {
        AppDesignTokens.currentPaletteId = PaletteId.forestCopper;
        final colors = AppDesignTokens.colorScheme(Brightness.light);
        expect(colors.primary, kPalettes[PaletteId.forestCopper]!.primary);
        AppDesignTokens.currentPaletteId = PaletteId.current;
      },
    );

    test('paletteIdFromName falls back to current for unknown values', () {
      expect(paletteIdFromName('does-not-exist'), PaletteId.current);
      expect(paletteIdFromName(null), PaletteId.current);
      expect(paletteIdFromName('cyanTeal'), PaletteId.cyanTeal);
    });
  });
}
