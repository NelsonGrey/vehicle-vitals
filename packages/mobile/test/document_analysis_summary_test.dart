import 'package:flutter_test/flutter_test.dart';
import 'package:vehicle_vitals_flutter/utils/document_analysis_summary.dart';

void main() {
  test('falls back to a source snippet when there is no extracted data', () {
    final summary = buildDocumentSummary(null, 'Some raw OCR text here');
    expect(summary, 'Some raw OCR text here');
  });

  test('falls back to a placeholder when there is no data at all', () {
    final summary = buildDocumentSummary(null, null);
    expect(summary, 'No analysis summary available yet');
  });

  test('summarizes extracted fields with title-cased category', () {
    final summary = buildDocumentSummary({
      'documentCategory': 'service_receipt',
      'serviceType': 'Oil change',
      'totalCost': 79.99,
      'serviceDate': '2026-02-01',
      'mileage': 32000,
    }, null);

    expect(
      summary,
      'Service Receipt: Oil change • \$79.99 • 2026-02-01 • 32000 mi',
    );
  });

  test('notes when no key fields were extracted yet', () {
    final summary = buildDocumentSummary({'documentCategory': 'receipt'}, '');
    expect(summary, 'Receipt: No key fields extracted yet');
  });
}
