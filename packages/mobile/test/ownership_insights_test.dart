import 'package:flutter_test/flutter_test.dart';
import 'package:vehicle_vitals_flutter/utils/ownership_insights.dart';

Map<String, dynamic> _file({
  required String documentCategory,
  String? serviceType,
  double? totalCost,
  String? serviceDate,
  String? sourceText,
  double confidence = 0.8,
}) {
  return {
    'path': 'p/$documentCategory',
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
        serviceType: 'oil change',
        totalCost: 80,
        serviceDate: '2026-01-15',
      ),
      _file(
        documentCategory: 'invoice',
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
        documentCategory: 'loan contract',
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
      _file(documentCategory: 'loan agreement', totalCost: 20000),
    ];

    final insights = computeOwnershipInsights(
      files,
      vehicleYear: currentYear - 2,
    );

    expect(insights.estimatedCurrentValue, isNotNull);
    expect(insights.estimatedValueRealized, isNotNull);
    expect(insights.estimatedCurrentValue! < 20000, isTrue);
  });
}
