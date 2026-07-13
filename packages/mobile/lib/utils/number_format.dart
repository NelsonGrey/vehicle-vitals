// Locale-aware mileage/currency formatting, mirroring
// packages/web/src/utils/currency.ts: the device locale's region subtag
// picks a currency (same REGION_CURRENCY table as web), and actual
// formatting goes through `intl`'s NumberFormat so grouping/decimal
// separators and currency placement follow local conventions (e.g.
// "10,000"/"$1,234.56" in en-US vs "10.000"/"1.234,56 €" in de-DE) instead
// of always rendering US-style regardless of where the user is.

import 'dart:ui' show PlatformDispatcher;

import 'package:intl/intl.dart' as intl;

const Map<String, String> _regionCurrency = {
  'US': 'USD',
  'GB': 'GBP',
  'CA': 'CAD',
  'AU': 'AUD',
  'NZ': 'NZD',
  'JP': 'JPY',
  'CN': 'CNY',
  'IN': 'INR',
  'MX': 'MXN',
  'BR': 'BRL',
  'CH': 'CHF',
  'SE': 'SEK',
  'NO': 'NOK',
  'DK': 'DKK',
  'SG': 'SGD',
  'HK': 'HKD',
  'ZA': 'ZAR',
  'KR': 'KRW',
  // Eurozone
  'DE': 'EUR',
  'FR': 'EUR',
  'ES': 'EUR',
  'IT': 'EUR',
  'NL': 'EUR',
  'IE': 'EUR',
  'PT': 'EUR',
  'AT': 'EUR',
  'BE': 'EUR',
  'FI': 'EUR',
  'GR': 'EUR',
};

const String _defaultLocale = 'en-US';
const String _defaultCurrency = 'USD';

// `intl`'s NumberFormat.currency falls back to printing the bare ISO code
// (e.g. "USD10.00") when it can't resolve a symbol for locale+currency
// pairs its bundled locale data doesn't cover — passing the symbol
// ourselves keeps output deterministic across locales/environments while
// `intl` still supplies the locale-correct grouping, decimal separator,
// and symbol placement.
const Map<String, String> _currencySymbols = {
  'USD': '\$',
  'CAD': '\$',
  'AUD': '\$',
  'NZD': '\$',
  'SGD': '\$',
  'HKD': '\$',
  'MXN': '\$',
  'GBP': '£',
  'EUR': '€',
  'JPY': '¥',
  'CNY': '¥',
  'INR': '₹',
  'BRL': 'R\$',
  'CHF': 'CHF',
  'SEK': 'kr',
  'NOK': 'kr',
  'DKK': 'kr',
  'ZAR': 'R',
  'KRW': '₩',
};

String _detectLocale() {
  final tag = PlatformDispatcher.instance.locale.toLanguageTag();
  return tag.isEmpty ? _defaultLocale : tag;
}

String _detectCurrency(String localeTag) {
  final region = localeTag.split(RegExp('[-_]')).length > 1
      ? localeTag.split(RegExp('[-_]'))[1].toUpperCase()
      : null;
  if (region != null && _regionCurrency.containsKey(region)) {
    return _regionCurrency[region]!;
  }
  return _defaultCurrency;
}

// `intl` expects underscore-separated locale identifiers (e.g. "en_GB"),
// while Locale.toLanguageTag() produces BCP-47 hyphenated form ("en-GB").
String _toIntlLocale(String localeTag) => localeTag.replaceAll('-', '_');

/// Formats an integer/mileage value with locale-appropriate grouping
/// separators (e.g. "10,000" in en-US, "10.000" in de-DE), matching
/// packages/web/src/utils/currency.ts's use of toLocaleString().
String formatWithCommas(num value, {String? locale}) {
  final localeTag = locale ?? _detectLocale();
  try {
    return intl.NumberFormat.decimalPattern(
      _toIntlLocale(localeTag),
    ).format(value.round());
  } catch (_) {
    return value.round().toString();
  }
}

/// Formats a monetary amount using the device's locale/currency, e.g.
/// "$1,234.56", "£1,234.56", "1.234,56 €" depending on region — mirrors
/// packages/web/src/utils/currency.ts's formatCurrency.
String formatCurrencyAmount(
  num amount, {
  String? locale,
  int fractionDigits = 2,
}) {
  final localeTag = locale ?? _detectLocale();
  final currency = _detectCurrency(localeTag);
  try {
    return intl.NumberFormat.currency(
      locale: _toIntlLocale(localeTag),
      name: currency,
      symbol: _currencySymbols[currency] ?? currency,
      decimalDigits: fractionDigits,
    ).format(amount);
  } catch (_) {
    return '\$${amount.toStringAsFixed(fractionDigits)}';
  }
}

/// Formats a low-high monetary range as "$1,200-$1,800" (rounded to whole
/// currency units), matching
/// packages/web/src/utils/currency.ts's formatCurrencyRange.
String formatCurrencyRange(num low, num high, {String? locale}) {
  final safeLow = low < 0 ? 0 : low.round();
  final safeHigh = high < safeLow ? safeLow : high.round();
  return '${formatCurrencyAmount(safeLow, locale: locale, fractionDigits: 0)}-'
      '${formatCurrencyAmount(safeHigh, locale: locale, fractionDigits: 0)}';
}
