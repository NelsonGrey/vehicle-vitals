// Mobile port of packages/web/src/utils/ownershipInsights.ts, trimmed to the
// concepts practical at mobile depth (no payment-calendar projection).

class MaintenanceBreakdownEntry {
  const MaintenanceBreakdownEntry({required this.label, required this.amount});

  final String label;
  final double amount;
}

class OwnershipInsights {
  const OwnershipInsights({
    required this.analyzedDocumentCount,
    required this.maintenanceDocsCount,
    required this.maintenanceTotalCost,
    required this.maintenanceAverageCost,
    this.latestServiceDate,
    required this.financeDocsCount,
    this.estimatedMonthlyPayment,
    this.estimatedCurrentValue,
    this.estimatedValueRealized,
    this.maintenanceBreakdown = const [],
  });

  final int analyzedDocumentCount;
  final int maintenanceDocsCount;
  final double maintenanceTotalCost;
  final double maintenanceAverageCost;
  final String? latestServiceDate;
  final int financeDocsCount;
  final double? estimatedMonthlyPayment;
  final double? estimatedCurrentValue;
  final double? estimatedValueRealized;
  // Maintenance spend grouped by service type — mirrors
  // packages/web/src/utils/ownershipInsights.ts's maintenanceBreakdown,
  // sorted highest-spend first.
  final List<MaintenanceBreakdownEntry> maintenanceBreakdown;

  bool get hasAnyInsight => analyzedDocumentCount > 0;
}

final RegExp _maintenanceKeywords = RegExp(
  r'(service|maintenance|repair|invoice|receipt|oil|brake|tire)',
  caseSensitive: false,
);

final RegExp _financeKeywords = RegExp(
  r'(loan|lease|finance|payment|contract|lender|apr)',
  caseSensitive: false,
);

final RegExp _monthlyPaymentText = RegExp(
  r'\$\s*([0-9]{2,5}(?:\.[0-9]{2})?)\s*(?:/\s*)?(?:mo|month|monthly)',
  caseSensitive: false,
);

double? _parseAmount(dynamic value) {
  if (value is num && !value.isNaN && value > 0) {
    return value.toDouble();
  }
  return null;
}

bool _isMaintenanceDocument(Map<String, dynamic> extracted, String category) {
  final serviceType = (extracted['serviceType'] ?? '').toString();
  return _maintenanceKeywords.hasMatch('$category $serviceType');
}

bool _isFinanceDocument(String category, String sourceText) {
  return _financeKeywords.hasMatch('$category $sourceText');
}

double? _extractMonthlyPaymentFromText(String? sourceText) {
  if (sourceText == null || sourceText.isEmpty) return null;
  final match = _monthlyPaymentText.firstMatch(sourceText);
  if (match == null) return null;
  final amount = double.tryParse(match.group(1) ?? '');
  if (amount == null || amount <= 0) return null;
  return amount;
}

String _formatServiceTypeLabel(String raw) {
  if (raw.isEmpty) return 'Other';
  final spaced = raw.replaceAll('_', ' ');
  return spaced.replaceAllMapped(
    RegExp(r'\b\w'),
    (match) => match.group(0)!.toUpperCase(),
  );
}

double _estimateDepreciationFactor(int vehicleYear) {
  final currentYear = DateTime.now().year;
  final age = (currentYear - vehicleYear).clamp(0, 1000000);
  var factor = 1.0;
  for (var year = 1; year <= age; year += 1) {
    factor *= year == 1 ? 0.85 : 0.9;
  }
  return factor < 0.2 ? 0.2 : factor;
}

/// [files] is a flattened list of file maps, each optionally carrying an
/// `analysis` map with `extracted`, `confidence`, and `sourceText` (the same
/// shape returned by FirestoreService.getAttachmentAnalyses, merged in by the
/// caller).
OwnershipInsights computeOwnershipInsights(
  List<Map<String, dynamic>> files, {
  int? vehicleYear,
}) {
  final analyzed = files.where((file) {
    final analysis = file['analysis'] as Map<String, dynamic>?;
    return analysis != null && analysis['extracted'] != null;
  }).toList();

  final maintenanceCosts = <double>[];
  final serviceDates = <String>[];
  var maintenanceCount = 0;
  var financeCount = 0;
  final monthlyPayments = <double>[];
  final principalCandidates = <double>[];
  final maintenanceByType = <String, double>{};

  for (final file in analyzed) {
    final analysis = file['analysis'] as Map<String, dynamic>;
    final extracted = Map<String, dynamic>.from(
      analysis['extracted'] as Map? ?? {},
    );
    final category = (extracted['documentCategory'] ?? '').toString();
    final sourceText = (analysis['sourceText'] ?? '').toString();

    if (_isMaintenanceDocument(extracted, category)) {
      maintenanceCount += 1;
      final cost = _parseAmount(extracted['totalCost']);
      if (cost != null) {
        maintenanceCosts.add(cost);
        final label = _formatServiceTypeLabel(
          (extracted['serviceType'] ?? category).toString(),
        );
        maintenanceByType[label] = (maintenanceByType[label] ?? 0) + cost;
      }
      final serviceDate = extracted['serviceDate'];
      if (serviceDate is String && serviceDate.isNotEmpty) {
        serviceDates.add(serviceDate);
      }
    }

    if (_isFinanceDocument(category, sourceText)) {
      financeCount += 1;
      final cost = _parseAmount(extracted['totalCost']);
      if (cost != null && cost <= 2000) {
        monthlyPayments.add(cost);
      } else {
        final fromText = _extractMonthlyPaymentFromText(sourceText);
        if (fromText != null) monthlyPayments.add(fromText);
      }
      if (cost != null && cost > 5000) {
        principalCandidates.add(cost);
      }
    }
  }

  serviceDates.sort();
  final latestServiceDate = serviceDates.isNotEmpty ? serviceDates.last : null;

  final estimatedMonthlyPayment = monthlyPayments.isNotEmpty
      ? double.parse(
          (monthlyPayments.reduce((a, b) => a + b) / monthlyPayments.length)
              .toStringAsFixed(2),
        )
      : null;

  final estimatedPrincipal = principalCandidates.isNotEmpty
      ? principalCandidates.reduce((a, b) => a > b ? a : b)
      : null;

  final depreciationFactor = (estimatedPrincipal != null && vehicleYear != null)
      ? _estimateDepreciationFactor(vehicleYear)
      : null;

  final estimatedCurrentValue =
      (estimatedPrincipal != null && depreciationFactor != null)
      ? double.parse(
          (estimatedPrincipal * depreciationFactor).toStringAsFixed(2),
        )
      : null;

  final estimatedValueRealized =
      (estimatedPrincipal != null && estimatedCurrentValue != null)
      ? double.parse(
          (estimatedPrincipal - estimatedCurrentValue).toStringAsFixed(2),
        )
      : null;

  final maintenanceBreakdown =
      maintenanceByType.entries
          .map(
            (entry) =>
                MaintenanceBreakdownEntry(label: entry.key, amount: entry.value),
          )
          .toList()
        ..sort((a, b) => b.amount.compareTo(a.amount));

  return OwnershipInsights(
    analyzedDocumentCount: analyzed.length,
    maintenanceDocsCount: maintenanceCount,
    maintenanceBreakdown: maintenanceBreakdown,
    maintenanceTotalCost: maintenanceCosts.fold(0.0, (a, b) => a + b),
    maintenanceAverageCost: maintenanceCosts.isNotEmpty
        ? double.parse(
            (maintenanceCosts.reduce((a, b) => a + b) / maintenanceCosts.length)
                .toStringAsFixed(2),
          )
        : 0,
    latestServiceDate: latestServiceDate,
    financeDocsCount: financeCount,
    estimatedMonthlyPayment: estimatedMonthlyPayment,
    estimatedCurrentValue: estimatedCurrentValue,
    estimatedValueRealized: estimatedValueRealized,
  );
}
