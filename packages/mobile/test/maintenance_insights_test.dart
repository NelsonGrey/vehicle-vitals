import 'package:flutter_test/flutter_test.dart';
import 'package:vehicle_vitals_flutter/models/maintenance.dart';
import 'package:vehicle_vitals_flutter/models/maintenance_attachment.dart';
import 'package:vehicle_vitals_flutter/utils/maintenance_insights.dart';

Maintenance _entry({
  required String id,
  required String title,
  double cost = 0,
  DateTime? date,
  bool hasKnownDate = true,
  List<MaintenanceAttachment> attachments = const [],
}) {
  final when = date ?? DateTime.utc(2026, 1, 1);
  return Maintenance(
    id: id,
    title: title,
    cost: cost,
    date: when,
    hasKnownDate: hasKnownDate,
    createdAt: when,
    updatedAt: when,
    attachments: attachments,
  );
}

const _receiptAttachment = MaintenanceAttachment(
  path: 'p1',
  url: 'https://example.com/1.jpg',
  name: 'receipt.jpg',
  type: 'jpg',
  size: 100,
  analysis: AttachmentAnalysis(
    extracted: AttachmentExtractedData(
      documentCategory: 'receipt',
      totalCost: 84.99,
      serviceDate: '2026-01-15',
    ),
    confidence: 0.85,
  ),
);

void main() {
  test('computeMaintenanceInsights handles an empty entry list', () {
    final insights = computeMaintenanceInsights([]);
    expect(insights.totalEntries, 0);
    expect(insights.totalSpend, 0);
    expect(insights.documentationCoverage, 0);
    expect(insights.averageConfidence, isNull);
    expect(insights.spendByCategory, isEmpty);
    expect(insights.needsReview, isEmpty);
  });

  test('computeMaintenanceInsights sums total spend across all entries', () {
    final insights = computeMaintenanceInsights([
      _entry(id: '1', title: 'Oil change', cost: 50),
      _entry(id: '2', title: 'Tires', cost: 200.50),
    ]);
    expect(insights.totalSpend, 250.50);
    expect(insights.totalEntries, 2);
  });

  test(
    'computeMaintenanceInsights groups spend by attachment documentCategory, '
    'and entries with no attachment fall under "No attachment"',
    () {
      final insights = computeMaintenanceInsights([
        _entry(
          id: '1',
          title: 'Oil change',
          cost: 84.99,
          attachments: const [_receiptAttachment],
        ),
        _entry(id: '2', title: 'Wiper blades', cost: 15),
      ]);

      final receiptBucket = insights.spendByCategory.firstWhere(
        (c) => c.label == 'Receipts',
      );
      expect(receiptBucket.amount, 84.99);
      expect(receiptBucket.count, 1);

      final manualBucket = insights.spendByCategory.firstWhere(
        (c) => c.label == 'No attachment',
      );
      expect(manualBucket.amount, 15);
    },
  );

  test(
    'computeMaintenanceInsights computes documentation coverage and average '
    'confidence only from entries/attachments that have them',
    () {
      final insights = computeMaintenanceInsights([
        _entry(
          id: '1',
          title: 'Oil change',
          cost: 84.99,
          attachments: const [_receiptAttachment],
        ),
        _entry(id: '2', title: 'Wiper blades', cost: 15),
      ]);

      expect(insights.entriesWithAttachments, 1);
      expect(insights.documentationCoverage, 0.5);
      expect(insights.averageConfidence, 0.85);
      expect(insights.analyzedAttachmentCount, 1);
    },
  );

  test(
    'computeMaintenanceInsights flags entries with low-confidence extraction '
    'as needing review, sorted lowest-confidence first',
    () {
      const lowConfidence = MaintenanceAttachment(
        path: 'p2',
        url: 'https://example.com/2.jpg',
        name: 'blurry.jpg',
        type: 'jpg',
        size: 100,
        analysis: AttachmentAnalysis(
          extracted: AttachmentExtractedData(documentCategory: 'other'),
          confidence: 0.15,
        ),
      );
      const veryLowConfidence = MaintenanceAttachment(
        path: 'p3',
        url: 'https://example.com/3.jpg',
        name: 'illegible.jpg',
        type: 'jpg',
        size: 100,
        analysis: AttachmentAnalysis(
          extracted: AttachmentExtractedData(),
          confidence: 0.05,
        ),
      );

      final insights = computeMaintenanceInsights([
        _entry(
          id: '1',
          title: 'Confident receipt',
          attachments: const [_receiptAttachment],
        ),
        _entry(id: '2', title: 'Blurry photo', attachments: const [lowConfidence]),
        _entry(
          id: '3',
          title: 'Illegible photo',
          attachments: const [veryLowConfidence],
        ),
      ]);

      expect(insights.needsReview, hasLength(2));
      expect(insights.needsReview.first.entry.title, 'Illegible photo');
      expect(insights.needsReview.last.entry.title, 'Blurry photo');
    },
  );

  test(
    'computeMaintenanceInsights buckets spend by calendar month, sorted '
    'chronologically',
    () {
      final insights = computeMaintenanceInsights([
        _entry(id: '1', title: 'A', cost: 50, date: DateTime.utc(2026, 1, 10)),
        _entry(id: '2', title: 'B', cost: 30, date: DateTime.utc(2026, 1, 20)),
        _entry(id: '3', title: 'C', cost: 100, date: DateTime.utc(2026, 3, 5)),
      ]);

      expect(insights.spendByMonth, hasLength(2));
      expect(insights.spendByMonth.first.monthStart, DateTime(2026, 1));
      expect(insights.spendByMonth.first.amount, 80);
      expect(insights.spendByMonth.last.monthStart, DateTime(2026, 3));
      expect(insights.spendByMonth.last.amount, 100);
    },
  );

  test(
    'computeMaintenanceInsights excludes entries with an unknown '
    '(fabricated) date from the monthly spend trend, since attributing '
    'them to "this month" would be misleading — but still counts their '
    'cost in the overall total',
    () {
      final insights = computeMaintenanceInsights([
        _entry(id: '1', title: 'Known', cost: 50, date: DateTime.utc(2026, 1, 10)),
        _entry(
          id: '2',
          title: 'Unknown date',
          cost: 999,
          hasKnownDate: false,
        ),
      ]);

      expect(insights.totalSpend, 1049);
      expect(insights.spendByMonth, hasLength(1));
      expect(insights.spendByMonth.first.amount, 50);
    },
  );
}
