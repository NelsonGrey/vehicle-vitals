import 'package:flutter_test/flutter_test.dart';
import 'package:vehicle_vitals_flutter/utils/ownership_insights.dart';

Map<String, dynamic> _file({
  required String documentCategory,
  String? categoryKey,
  String? serviceType,
  double? totalCost,
  String? serviceDate,
  String? sourceText,
  double confidence = 0.8,
}) {
  return {
    'path': 'p/$documentCategory',
    'categoryKey': categoryKey,
    'analysis': {
      'confidence': confidence,
      'sourceText': sourceText,
      'extracted': {
        'documentCategory': documentCategory,
        'serviceType': ?serviceType,
        'totalCost': ?totalCost,
        'serviceDate': ?serviceDate,
      },
    },
  };
}

void main() {
  test('returns empty insights when no files are analyzed', () {
    final insights = computeOwnershipInsights([]);
    expect(insights.hasAnyInsight, isFalse);
    expect(insights.analyzedDocumentCount, 0);
  });

  test('aggregates maintenance docs cost, count, and latest service date', () {
    final files = [
      _file(
        documentCategory: 'receipt',
        categoryKey: 'maintenance',
        serviceType: 'oil change',
        totalCost: 80,
        serviceDate: '2026-01-15',
      ),
      _file(
        documentCategory: 'invoice',
        categoryKey: 'maintenance',
        serviceType: 'brake service',
        totalCost: 320,
        serviceDate: '2026-03-01',
      ),
    ];

    final insights = computeOwnershipInsights(files);

    expect(insights.hasAnyInsight, isTrue);
    expect(insights.analyzedDocumentCount, 2);
    expect(insights.maintenanceDocsCount, 2);
    expect(insights.maintenanceTotalCost, 400);
    expect(insights.maintenanceAverageCost, 200);
    expect(insights.latestServiceDate, '2026-03-01');
  });

  test('detects finance documents and estimates monthly payment', () {
    final files = [
      _file(
        documentCategory: 'document',
        categoryKey: 'finance',
        totalCost: 450,
        sourceText: 'Monthly payment of \$450/mo due on the 1st',
      ),
    ];

    final insights = computeOwnershipInsights(files, vehicleYear: 2022);

    expect(insights.financeDocsCount, 1);
    expect(insights.estimatedMonthlyPayment, 450);
  });

  test('estimates current value and value realized from a large principal', () {
    final currentYear = DateTime.now().year;
    final files = [
      _file(
        documentCategory: 'document',
        categoryKey: 'finance',
        totalCost: 20000,
      ),
    ];

    final insights = computeOwnershipInsights(
      files,
      vehicleYear: currentYear - 2,
    );

    expect(insights.estimatedCurrentValue, isNotNull);
    expect(insights.estimatedValueRealized, isNotNull);
    expect(insights.estimatedCurrentValue! < 20000, isTrue);
  });

  test(
    'excludes the vehicle purchase price (Bill of Sale) from maintenance '
    'spend even though the AI tags it a generic "receipt"',
    () {
      final files = [
        // Same generic tag a real maintenance receipt gets — this is the
        // exact ambiguity that caused a $100k+ vehicle purchase price to be
        // counted as "maintenance spend captured" for a real user's vehicle.
        _file(
          documentCategory: 'receipt',
          categoryKey: 'ownership',
          totalCost: 108000,
          serviceDate: '2025-06-01',
        ),
        _file(
          documentCategory: 'receipt',
          categoryKey: 'maintenance',
          serviceType: 'oil change',
          totalCost: 75,
          serviceDate: '2026-01-15',
        ),
      ];

      final insights = computeOwnershipInsights(files);

      expect(insights.analyzedDocumentCount, 2);
      expect(insights.maintenanceDocsCount, 1);
      expect(insights.maintenanceTotalCost, 75);
      expect(insights.latestServiceDate, '2026-01-15');
    },
  );
}
