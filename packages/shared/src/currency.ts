/**
 * Locale-aware currency formatting. Currency code is inferred from the
 * browser's locale region subtag (e.g. `en-GB` → GBP) since the app does not
 * collect an explicit country/currency preference. Falls back to USD/en-US
 * whenever detection is unavailable (SSR, unsupported Intl, unknown region,
 * or a non-browser runtime like Node/Cloud Functions).
 *
 * Kept isomorphic (no Firebase/browser-only imports) so it can be shared by
 * every consumer that formats a monetary amount — packages/web's own
 * components plus this package's own documentAnalysisSummary.ts — instead
 * of each hand-rolling its own currency string.
 */

const REGION_CURRENCY: Record<string, string> = {
  US: 'USD',
  GB: 'GBP',
  CA: 'CAD',
  AU: 'AUD',
  NZ: 'NZD',
  JP: 'JPY',
  CN: 'CNY',
  IN: 'INR',
  MX: 'MXN',
  BR: 'BRL',
  CH: 'CHF',
  SE: 'SEK',
  NO: 'NOK',
  DK: 'DKK',
  SG: 'SGD',
  HK: 'HKD',
  ZA: 'ZAR',
  KR: 'KRW',
  // Eurozone
  DE: 'EUR',
  FR: 'EUR',
  ES: 'EUR',
  IT: 'EUR',
  NL: 'EUR',
  IE: 'EUR',
  PT: 'EUR',
  AT: 'EUR',
  BE: 'EUR',
  FI: 'EUR',
  GR: 'EUR',
};

const DEFAULT_LOCALE = 'en-US';
const DEFAULT_CURRENCY = 'USD';

function detectLocale(): string {
  // Accessed via globalThis (rather than the bare `navigator` identifier)
  // since this package's tsconfig has no "DOM" lib — it needs to type-check
  // in a plain Node context (e.g. Cloud Functions) too, not just browsers.
  const nav = (globalThis as { navigator?: { language?: string } }).navigator;
  if (nav?.language) {
    return nav.language;
  }
  return DEFAULT_LOCALE;
}

function detectCurrency(locale: string): string {
  const region = locale.split('-')[1]?.toUpperCase();
  if (region && REGION_CURRENCY[region]) {
    return REGION_CURRENCY[region];
  }
  return DEFAULT_CURRENCY;
}

export interface CurrencyContext {
  locale: string;
  currency: string;
}

export function getCurrencyContext(): CurrencyContext {
  const locale = detectLocale();
  return { locale, currency: detectCurrency(locale) };
}

/**
 * Formats a monetary amount using the user's browser locale/currency, e.g.
 * "$1,234.56", "£1,234.56", "1.234,56 €" depending on region.
 */
export function formatCurrency(
  amount: number | undefined | null,
  opts?: { fractionDigits?: number }
): string {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    return 'Unknown';
  }

  const { locale, currency } = getCurrencyContext();
  const fractionDigits = opts?.fractionDigits ?? 2;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(fractionDigits)}`;
  }
}

/**
 * Formats a monetary amount compactly, e.g. "$1.2k" for large values.
 * Below $1,000, compact notation has nothing useful to abbreviate — using
 * it anyway capped precision at 1 decimal digit and dropped trailing
 * zeros, rendering $12.40 as $12.4. Amounts under $1,000 use standard
 * two-decimal currency formatting instead.
 */
export function formatCurrencyCompact(amount: number | undefined | null): string {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    return 'Unknown';
  }

  if (Math.abs(amount) < 1000) {
    return formatCurrency(amount);
  }

  const { locale, currency } = getCurrencyContext();

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  } catch {
    return `$${(amount / 1000).toFixed(1)}k`;
  }
}

/**
 * Formats a low-high monetary range, e.g. "$1,200-$1,800".
 */
export function formatCurrencyRange(
  low: number | undefined | null,
  high: number | undefined | null
): string {
  const safeLow = Math.max(0, Math.round(low || 0));
  const safeHigh = Math.max(safeLow, Math.round(high || 0));
  return `${formatCurrency(safeLow, { fractionDigits: 0 })}-${formatCurrency(safeHigh, { fractionDigits: 0 })}`;
}
