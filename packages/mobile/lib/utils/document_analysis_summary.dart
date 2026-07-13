// Mobile port of packages/shared/src/documentAnalysisSummary.ts.

import 'number_format.dart';

String getSourceSnippet(String? sourceText, {int maxLength = 240}) {
  if (sourceText == null || sourceText.isEmpty) return '';
  final compact = sourceText.replaceAll(RegExp(r'\s+'), ' ').trim();
  if (compact.length <= maxLength) return compact;
  return '${compact.substring(0, maxLength)}...';
}

String _titleCase(String value) {
  return value
      .split(' ')
      .where((token) => token.isNotEmpty)
      .map(
        (token) =>
            token.substring(0, 1).toUpperCase() +
            token.substring(1).toLowerCase(),
      )
      .join(' ');
}

String buildDocumentSummary(
  Map<String, dynamic>? extracted,
  String? sourceText, {
  String? locale,
}) {
  if (extracted == null) {
    final snippet = getSourceSnippet(sourceText, maxLength: 120);
    return snippet.isNotEmpty ? snippet : 'No analysis summary available yet';
  }

  final categoryRaw = extracted['documentCategory'];
  final category = (categoryRaw is String && categoryRaw.isNotEmpty)
      ? categoryRaw.replaceAll('_', ' ')
      : 'document';

  final details = <String>[];
  final serviceType = extracted['serviceType'];
  if (serviceType is String && serviceType.isNotEmpty) {
    details.add(serviceType);
  }
  final totalCost = extracted['totalCost'];
  if (totalCost is num) {
    details.add(formatCurrencyAmount(totalCost, locale: locale));
  }
  final serviceDate = extracted['serviceDate'];
  if (serviceDate is String && serviceDate.isNotEmpty) {
    details.add(serviceDate);
  }
  final mileage = extracted['mileage'];
  if (mileage is num) {
    details.add('${formatWithCommas(mileage, locale: locale)} mi');
  }

  if (details.isNotEmpty) {
    return '${_titleCase(category)}: ${details.join(' • ')}';
  }

  final snippet = getSourceSnippet(sourceText, maxLength: 120);
  if (snippet.isNotEmpty) {
    return '${_titleCase(category)}: $snippet';
  }

  return '${_titleCase(category)}: No key fields extracted yet';
}
