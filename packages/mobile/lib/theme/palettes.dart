import 'package:flutter/material.dart';

/// The 5 curated color palettes a user can select, applied to web and
/// mobile together or independently (see PaletteService). Semantic status
/// colors (AppDesignTokens.success/warning/danger) are NOT part of a
/// palette -- they carry meaning and stay identical across all 5.
enum PaletteId { current, cyanTeal, indigo, forestCopper, warmGraphite }

/// One palette's brand colors. `header`/`primary`/`brandAccent` apply in
/// both light and dark mode (buttons and the app header stay the palette's
/// brand color regardless of brightness, matching how the header already
/// behaved pre-palette); `bg`/`surface`/`border`/`text`/`muted` apply in
/// light mode only -- dark mode keeps the app's existing dark-slate
/// structure unchanged across all 5 palettes (see AppColorScheme.dark).
class PaletteDefinition {
  const PaletteDefinition({
    required this.label,
    required this.header,
    required this.primary,
    required this.brandAccent,
    required this.bg,
    required this.surface,
    required this.border,
    required this.text,
    required this.muted,
  });

  final String label;
  final Color header;
  final Color primary;
  final Color brandAccent;
  final Color bg;
  final Color surface;
  final Color border;
  final Color text;
  final Color muted;
}

/// Keep byte-for-byte in lockstep with packages/web/src/theme/palettes.ts --
/// same 5 ids, same hex, reviewed together whenever a palette value changes.
/// Source: the published mockup canvas
/// (https://claude.ai/code/artifact/c33697ec-ce29-4de3-8ab8-5beacf137d4f),
/// approved by Mark 2026-09-14.
const Map<PaletteId, PaletteDefinition> kPalettes = {
  PaletteId.current: PaletteDefinition(
    label: 'Current (Slate & Blue)',
    header: Color(0xFF334155),
    primary: Color(0xFF334155),
    brandAccent: Color(0xFF2563EB),
    bg: Color(0xFFF8FAFC),
    surface: Color(0xFFFFFFFF),
    border: Color(0xFFE2E8F0),
    text: Color(0xFF0F172A),
    muted: Color(0xFF64748B),
  ),
  PaletteId.cyanTeal: PaletteDefinition(
    label: 'Brand Cyan & Teal',
    header: Color(0xFF020617),
    primary: Color(0xFF0E7490),
    brandAccent: Color(0xFF0D9488),
    bg: Color(0xFFFFFAF3),
    surface: Color(0xFFFFFFFF),
    border: Color(0xFFDDEEF0),
    text: Color(0xFF0F172A),
    muted: Color(0xFF64748B),
  ),
  PaletteId.indigo: PaletteDefinition(
    label: 'Deep Indigo',
    header: Color(0xFF1E1B4B),
    primary: Color(0xFF4338CA),
    brandAccent: Color(0xFF7C3AED),
    bg: Color(0xFFF6F5FF),
    surface: Color(0xFFFFFFFF),
    border: Color(0xFFE1DFF7),
    text: Color(0xFF1E1B2E),
    muted: Color(0xFF6B6B85),
  ),
  PaletteId.forestCopper: PaletteDefinition(
    label: 'Workshop Forest & Copper',
    header: Color(0xFF14532D),
    primary: Color(0xFF166534),
    brandAccent: Color(0xFFC2410C),
    bg: Color(0xFFF7F5F0),
    surface: Color(0xFFFFFFFF),
    border: Color(0xFFE5E0D5),
    text: Color(0xFF1C1917),
    // Nudged 2 units darker per channel from the mockup's #78716C -- that
    // exact value measured 4.40:1 against this palette's `bg`, just under
    // WCAG AA's 4.5:1 floor for text. Imperceptible visually, confirmed by
    // a real contrast calculation (see test/palette_theme_test.dart).
    muted: Color(0xFF766F6A),
  ),
  PaletteId.warmGraphite: PaletteDefinition(
    label: 'Warm Graphite & Copper',
    header: Color(0xFF292524),
    primary: Color(0xFF44403C),
    brandAccent: Color(0xFFC2703D),
    bg: Color(0xFFFAFAF9),
    surface: Color(0xFFFFFFFF),
    border: Color(0xFFE7E5E4),
    text: Color(0xFF1C1917),
    muted: Color(0xFF78716C),
  ),
};

/// Parse a Firestore-stored palette id string back to a [PaletteId],
/// falling back to [PaletteId.current] for anything unrecognized (a palette
/// removed in a later release, a corrupt value, etc.) rather than crashing.
PaletteId paletteIdFromName(String? name) {
  return PaletteId.values.firstWhere(
    (id) => id.name == name,
    orElse: () => PaletteId.current,
  );
}
