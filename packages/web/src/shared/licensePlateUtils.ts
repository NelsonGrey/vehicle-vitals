/**
 * License Plate Utilities
 * Handles validation, formatting, and normalization of license plates by locale.
 */

type PlateLocale = 'US' | 'CA' | 'generic';

interface PlateFormatRules {
  maxLength: number;
  patternHint: string;
  exampleFormat: string;
  validateFn: (plate: string) => boolean;
}

/**
 * Get format rules for a specific locale.
 * Defaults to generic rules for unknown locales.
 */
function getFormatRules(locale: PlateLocale): PlateFormatRules {
  const rules: Record<PlateLocale, PlateFormatRules> = {
    US: {
      maxLength: 8,
      patternHint: 'Typically 1-8 characters (letters/numbers, no spaces)',
      exampleFormat: 'ABC1234',
      validateFn: (plate: string) => {
        // US plates: 1-8 alphanumerics, may contain numbers, letters, hyphens
        return /^[A-Z0-9-]{1,8}$/.test(plate.toUpperCase());
      },
    },
    CA: {
      maxLength: 8,
      patternHint: 'Typically format: XXX NNNN (letters, space, numbers)',
      exampleFormat: 'ABC 1234',
      validateFn: (plate: string) => {
        // Canadian plates: usually 3 letters, space, 4 numbers
        // But also support other formats
        const normalized = plate.toUpperCase();
        return (
          /^[A-Z0-9\s-]{1,8}$/.test(normalized) &&
          /[A-Z]/.test(normalized) &&
          /[0-9]/.test(normalized)
        );
      },
    },
    generic: {
      maxLength: 10,
      patternHint: 'Letters, numbers, hyphens, and spaces allowed',
      exampleFormat: 'ABC-1234',
      validateFn: (plate: string) => {
        // Generic: allow alphanumerics, hyphens, spaces; 1-10 chars
        return (
          /^[A-Z0-9\s-]{1,10}$/i.test(plate) &&
          plate.trim().length >= 1 &&
          plate.trim().length <= 10
        );
      },
    },
  };

  return rules[locale] || rules.generic;
}

/**
 * Detect locale from browser/state.
 * In production, this could read from user preferences or navigator.language.
 */
function detectLocale(): PlateLocale {
  // For now, default to US. In future, could check:
  // - User profile/preferences
  // - navigator.language
  // - IP geolocation
  // - State code if collected elsewhere
  return 'US';
}

/**
 * Normalize a license plate:
 * - Trim whitespace
 * - Convert to uppercase
 * - Collapse multiple spaces to single space
 */
export function normalizeLicensePlate(plate: string | undefined): string {
  if (!plate) {
    return '';
  }

  return plate
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .slice(0, 10); // Hard limit
}

/**
 * Format a license plate for display.
 * Applies locale-specific formatting rules.
 */
export function formatLicensePlate(
  plate: string | undefined,
  locale?: PlateLocale
): string {
  if (!plate) {
    return '';
  }

  const normalized = normalizeLicensePlate(plate);
  const targetLocale = locale || detectLocale();

  // For Canadian plates, apply spacing if not already present
  if (
    targetLocale === 'CA' &&
    /^[A-Z]{3}[0-9]{4}$/.test(normalized.replace(/\s/g, ''))
  ) {
    const chars = normalized.replace(/\s/g, '');
    return `${chars.slice(0, 3)} ${chars.slice(3)}`;
  }

  // For other locales, just return normalized version
  return normalized;
}

/**
 * Validate a license plate according to locale rules.
 * Returns object with isValid flag and optional error message.
 */
export function validateLicensePlate(
  plate: string | undefined,
  locale?: PlateLocale
): { isValid: boolean; error?: string } {
  if (!plate || plate.trim() === '') {
    // License plate is optional
    return { isValid: true };
  }

  const normalized = normalizeLicensePlate(plate);
  const targetLocale = locale || detectLocale();
  const rules = getFormatRules(targetLocale);

  if (normalized.length > rules.maxLength) {
    return {
      isValid: false,
      error: `Too long. Maximum ${rules.maxLength} characters.`,
    };
  }

  if (!rules.validateFn(normalized)) {
    return {
      isValid: false,
      error: rules.patternHint,
    };
  }

  return { isValid: true };
}

/**
 * Get a hint string for the current locale.
 */
export function getPlateFormatHint(locale?: PlateLocale): string {
  const targetLocale = locale || detectLocale();
  const rules = getFormatRules(targetLocale);
  return `${rules.exampleFormat} - ${rules.patternHint}`;
}

/**
 * Check if a plate is empty or whitespace-only.
 */
export function isPlateEmpty(plate: string | undefined): boolean {
  return !plate || plate.trim() === '';
}
