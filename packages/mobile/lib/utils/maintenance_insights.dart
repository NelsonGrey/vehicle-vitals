import 'package:intl/intl.dart';

import '../models/maintenance.dart';

// Confidence below this is surfaced as "needs review" — the same rough
// threshold as the functions repo's low end of the confidence range
// (0.05-0.95), picked to flag entries where extraction likely got little
// right rather than ones that are merely imperfect.
const double lowConfidenceThreshold = 0.4;

class CategorySpend {
  final String label;
  final double amount;
  final int count;

  const CategorySpend({
    required this.label,
    required this.amount,
    required this.count,
  });
}

class MonthlySpend {
  final DateTime monthStart;
  final double amount;

  const MonthlySpend({required this.monthStart, required this.amount});

  String get label => DateFormat('MMM yyyy').format(monthStart);
}

class ReviewCandidate {
  final Maintenance entry;
  final double confidence;

  const ReviewCandidate({required this.entry, required this.confidence});
}

class MaintenanceInsights {
  final int totalEntries;
  final double totalSpend;
  final int entriesWithAttachments;
  final int totalAttachments;
  final int analyzedAttachmentCount;
  // Null when no attachment has been analyzed yet — distinct from 0, which
  // would misleadingly read as "extraction is failing."
  final double? averageConfidence;
  final List<CategorySpend> spendByCategory;
  final List<MonthlySpend> spendByMonth;
  final List<ReviewCandidate> needsReview;

  const MaintenanceInsights({
    required this.totalEntries,
    required this.totalSpend,
    required this.entriesWithAttachments,
    required this.totalAttachments,
    required this.analyzedAttachmentCount,
    required this.averageConfidence,
    required this.spendByCategory,
    required this.spendByMonth,
    required this.needsReview,
  });

  double get documentationCoverage =>
      totalEntries == 0 ? 0.0 : entriesWithAttachments / totalEntries;
}

String _categoryLabel(String? documentCategory) {
  switch (documentCategory) {
    case 'receipt':
      return 'Receipts';
    case 'invoice':
      return 'Invoices';
    case 'image':
      return 'Photos';
    case 'document':
      return 'Documents';
    case 'other':
      return 'Other attachments';
    default:
      return 'No attachment';
  }
}

// The category an entry is grouped under for spend-by-category: the
// documentCategory of its first analyzed attachment, or 'No attachment' if
// it has none or analysis hasn't completed. Picking the FIRST attachment
// (not e.g. highest-confidence) keeps this simple and matches how a user
// would think of "the receipt for this entry" when there's normally just one.
String? _entryDocumentCategory(Maintenance entry) {
  for (final attachment in entry.attachments) {
    final category = attachment.analysis?.extracted.documentCategory;
    if (category != null) return category;
  }
  return null;
}

MaintenanceInsights computeMaintenanceInsights(List<Maintenance> entries) {
  double totalSpend = 0;
  int entriesWithAttachments = 0;
  int totalAttachments = 0;
  int analyzedAttachmentCount = 0;
  double confidenceSum = 0;
  final categoryTotals = <String, CategorySpend>{};
  final monthTotals = <DateTime, double>{};
  final needsReview = <ReviewCandidate>[];

  for (final entry in entries) {
    totalSpend += entry.cost;

    if (entry.attachments.isNotEmpty) {
      entriesWithAttachments += 1;
    }
    totalAttachments += entry.attachments.length;

    double? lowestConfidenceForEntry;
    for (final attachment in entry.attachments) {
      final analysis = attachment.analysis;
      if (analysis == null) continue;
      analyzedAttachmentCount += 1;
      confidenceSum += analysis.confidence;
      if (lowestConfidenceForEntry == null ||
          analysis.confidence < lowestConfidenceForEntry) {
        lowestConfidenceForEntry = analysis.confidence;
      }
    }
    if (lowestConfidenceForEntry != null &&
        lowestConfidenceForEntry < lowConfidenceThreshold) {
      needsReview.add(
        ReviewCandidate(entry: entry, confidence: lowestConfidenceForEntry),
      );
    }

    final categoryKey = _categoryLabel(_entryDocumentCategory(entry));
    final existing = categoryTotals[categoryKey];
    categoryTotals[categoryKey] = CategorySpend(
      label: categoryKey,
      amount: (existing?.amount ?? 0) + entry.cost,
      count: (existing?.count ?? 0) + 1,
    );

    final monthStart = DateTime(entry.date.year, entry.date.month);
    monthTotals[monthStart] = (monthTotals[monthStart] ?? 0) + entry.cost;
  }

  final spendByCategory = categoryTotals.values.toList()
    ..sort((a, b) => b.amount.compareTo(a.amount));

  final spendByMonth =
      monthTotals.entries
          .map((e) => MonthlySpend(monthStart: e.key, amount: e.value))
          .toList()
        ..sort((a, b) => a.monthStart.compareTo(b.monthStart));

  needsReview.sort((a, b) => a.confidence.compareTo(b.confidence));

  return MaintenanceInsights(
    totalEntries: entries.length,
    totalSpend: totalSpend,
    entriesWithAttachments: entriesWithAttachments,
    totalAttachments: totalAttachments,
    analyzedAttachmentCount: analyzedAttachmentCount,
    averageConfidence: analyzedAttachmentCount == 0
        ? null
        : confidenceSum / analyzedAttachmentCount,
    spendByCategory: spendByCategory,
    spendByMonth: spendByMonth,
    needsReview: needsReview,
  );
}
