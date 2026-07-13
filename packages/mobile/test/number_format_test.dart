import 'package:flutter_test/flutter_test.dart';
import 'package:vehicle_vitals_flutter/utils/number_format.dart';

void main() {
  group('formatWithCommas', () {
    test('groups thousands (en-US)', () {
      expect(formatWithCommas(1000, locale: 'en-US'), '1,000');
      expect(formatWithCommas(10000, locale: 'en-US'), '10,000');
      expect(formatWithCommas(108000, locale: 'en-US'), '108,000');
      expect(formatWithCommas(1234567, locale: 'en-US'), '1,234,567');
    });

    test('uses local grouping conventions for other locales', () {
      // German uses "." as the thousands separator.
      expect(formatWithCommas(10000, locale: 'de-DE'), '10.000');
    });

    test('leaves small numbers unchanged', () {
      expect(formatWithCommas(0, locale: 'en-US'), '0');
      expect(formatWithCommas(999, locale: 'en-US'), '999');
    });

    test('handles negative values', () {
      expect(formatWithCommas(-40000, locale: 'en-US'), '-40,000');
    });

    test('rounds fractional values first', () {
      expect(formatWithCommas(1234.6, locale: 'en-US'), '1,235');
    });
  });

  group('formatCurrencyAmount', () {
    test('formats USD with grouping and two decimal places', () {
      expect(formatCurrencyAmount(108000, locale: 'en-US'), '\$108,000.00');
      expect(formatCurrencyAmount(89.99, locale: 'en-US'), '\$89.99');
    });

    test('carries a cents rounding overflow into the whole dollar amount', () {
      expect(formatCurrencyAmount(19.999, locale: 'en-US'), '\$20.00');
    });

    test('handles negative amounts', () {
      expect(formatCurrencyAmount(-425.5, locale: 'en-US'), '-\$425.50');
    });

    test('infers GBP from an en-GB locale', () {
      expect(formatCurrencyAmount(1234.5, locale: 'en-GB'), '£1,234.50');
    });

    test('infers EUR and local grouping/decimal conventions from de-DE', () {
      // German-style: "." for grouping, "," for the decimal separator, and
      // a non-breaking space (U+00A0) before the currency symbol.
      expect(
        formatCurrencyAmount(1234.5, locale: 'de-DE'),
        '1.234,50\u{00A0}€',
      );
    });

    test('falls back to USD for an unmapped region', () {
      expect(formatCurrencyAmount(10, locale: 'en-ZZ'), '\$10.00');
    });
  });

  group('formatCurrencyRange', () {
    test('formats a low-high range with grouping, no decimals', () {
      expect(
        formatCurrencyRange(1200, 1800, locale: 'en-US'),
        '\$1,200-\$1,800',
      );
    });

    test('clamps a negative low to zero', () {
      expect(formatCurrencyRange(-500, 900, locale: 'en-US'), '\$0-\$900');
    });

    test('clamps high to at least low when high is smaller', () {
      expect(formatCurrencyRange(500, 100, locale: 'en-US'), '\$500-\$500');
    });
  });
}
