// Thousands-separator formatting for mileage and currency values, matching
// packages/web/src/utils/currency.ts's use of Intl.NumberFormat for the
// same fields — mobile previously showed these as raw digit strings (e.g.
// "$108000.00", "10000 miles"), unlike web's "$108,000.00", "10,000 miles".
// Kept dependency-free (no `intl` package) since comma-grouping plain
// integers doesn't need a full i18n library.

String formatWithCommas(num value) {
  final isNegative = value < 0;
  final digits = value.round().abs().toString();
  final buffer = StringBuffer();
  for (var i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 == 0) {
      buffer.write(',');
    }
    buffer.write(digits[i]);
  }
  return isNegative ? '-$buffer' : buffer.toString();
}

/// Formats a monetary amount as "$1,234.56".
String formatCurrencyAmount(num amount) {
  final isNegative = amount < 0;
  final absAmount = amount.abs();
  var wholePart = absAmount.truncate();
  var cents = ((absAmount - wholePart) * 100).round();
  if (cents == 100) {
    wholePart += 1;
    cents = 0;
  }
  final sign = isNegative ? '-' : '';
  return '$sign\$${formatWithCommas(wholePart)}.${cents.toString().padLeft(2, '0')}';
}

/// Formats a low-high monetary range as "$1,200-$1,800" (rounded to whole
/// dollars), matching packages/web/src/utils/currency.ts's formatCurrencyRange.
String formatCurrencyRange(num low, num high) {
  final safeLow = low < 0 ? 0 : low.round();
  final safeHigh = high < safeLow ? safeLow : high.round();
  return '\$${formatWithCommas(safeLow)}-\$${formatWithCommas(safeHigh)}';
}
