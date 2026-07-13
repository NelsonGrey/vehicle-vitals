import 'package:flutter_test/flutter_test.dart';
import 'package:vehicle_vitals_flutter/utils/number_format.dart';

void main() {
  group('formatWithCommas', () {
    test('groups thousands', () {
      expect(formatWithCommas(1000), '1,000');
      expect(formatWithCommas(10000), '10,000');
      expect(formatWithCommas(108000), '108,000');
      expect(formatWithCommas(1234567), '1,234,567');
    });

    test('leaves small numbers unchanged', () {
      expect(formatWithCommas(0), '0');
      expect(formatWithCommas(999), '999');
    });

    test('handles negative values', () {
      expect(formatWithCommas(-40000), '-40,000');
    });

    test('rounds fractional values first', () {
      expect(formatWithCommas(1234.6), '1,235');
    });
  });

  group('formatCurrencyAmount', () {
    test('formats with grouping and two decimal places', () {
      expect(formatCurrencyAmount(108000), '\$108,000.00');
      expect(formatCurrencyAmount(89.99), '\$89.99');
    });

    test('carries a cents rounding overflow into the whole dollar amount', () {
      expect(formatCurrencyAmount(19.999), '\$20.00');
    });

    test('handles negative amounts', () {
      expect(formatCurrencyAmount(-425.5), '-\$425.50');
    });
  });

  group('formatCurrencyRange', () {
    test('formats a low-high range with grouping, no decimals', () {
      expect(formatCurrencyRange(1200, 1800), '\$1,200-\$1,800');
    });

    test('clamps a negative low to zero', () {
      expect(formatCurrencyRange(-500, 900), '\$0-\$900');
    });

    test('clamps high to at least low when high is smaller', () {
      expect(formatCurrencyRange(500, 100), '\$500-\$500');
    });
  });
}
