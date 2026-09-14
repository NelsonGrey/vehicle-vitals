// The 5 curated color palettes a user can select, applied to web and mobile
// together or independently (see ThemeContext). Semantic status colors
// (Tailwind's accent/warning/danger scales) are NOT part of a palette --
// they carry meaning and stay identical across all 5.
//
// Keep byte-for-byte in lockstep with
// packages/mobile/lib/theme/palettes.dart -- same 5 ids, same hex, reviewed
// together whenever a palette value changes. Source: the published mockup
// canvas (https://claude.ai/code/artifact/c33697ec-ce29-4de3-8ab8-5beacf137d4f),
// approved by Mark 2026-09-14.
export type PaletteId =
  | 'current'
  | 'cyanTeal'
  | 'indigo'
  | 'forestCopper'
  | 'warmGraphite';

export interface PaletteDefinition {
  label: string;
  header: string;
  primary: string;
  brandAccent: string;
  bg: string;
  surface: string;
  border: string;
  text: string;
  muted: string;
}

export const PALETTE_IDS: PaletteId[] = [
  'current',
  'cyanTeal',
  'indigo',
  'forestCopper',
  'warmGraphite',
];

export const PALETTES: Record<PaletteId, PaletteDefinition> = {
  current: {
    label: 'Current (Slate & Blue)',
    header: '#334155',
    primary: '#334155',
    brandAccent: '#2563EB',
    bg: '#F8FAFC',
    surface: '#FFFFFF',
    border: '#E2E8F0',
    text: '#0F172A',
    muted: '#64748B',
  },
  cyanTeal: {
    label: 'Brand Cyan & Teal',
    header: '#020617',
    primary: '#0E7490',
    brandAccent: '#0D9488',
    bg: '#FFFAF3',
    surface: '#FFFFFF',
    border: '#DDEEF0',
    text: '#0F172A',
    muted: '#64748B',
  },
  indigo: {
    label: 'Deep Indigo',
    header: '#1E1B4B',
    primary: '#4338CA',
    brandAccent: '#7C3AED',
    bg: '#F6F5FF',
    surface: '#FFFFFF',
    border: '#E1DFF7',
    text: '#1E1B2E',
    muted: '#6B6B85',
  },
  forestCopper: {
    label: 'Workshop Forest & Copper',
    header: '#14532D',
    primary: '#166534',
    brandAccent: '#C2410C',
    bg: '#F7F5F0',
    surface: '#FFFFFF',
    border: '#E5E0D5',
    text: '#1C1917',
    // Nudged 2 units darker per channel from the mockup's #78716C -- that
    // exact value measured 4.40:1 against this palette's `bg`, just under
    // WCAG AA's 4.5:1 floor for text. Imperceptible visually, confirmed by
    // a real contrast calculation. Keep in lockstep with the same fix in
    // packages/mobile/lib/theme/palettes.dart.
    muted: '#766F6A',
  },
  warmGraphite: {
    label: 'Warm Graphite & Copper',
    header: '#292524',
    primary: '#44403C',
    brandAccent: '#C2703D',
    bg: '#FAFAF9',
    surface: '#FFFFFF',
    border: '#E7E5E4',
    text: '#1C1917',
    muted: '#78716C',
  },
};

/** Parse a Firestore-stored palette id, falling back to 'current' for
 * anything unrecognized (a palette removed in a later release, a corrupt
 * value, etc.) rather than rendering broken CSS. */
export function paletteIdFromValue(value: unknown): PaletteId {
  return typeof value === 'string' && (PALETTE_IDS as string[]).includes(value)
    ? (value as PaletteId)
    : 'current';
}
