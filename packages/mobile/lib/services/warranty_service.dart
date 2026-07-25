import 'package:cloud_functions/cloud_functions.dart';

const bool _screenshotMode = bool.fromEnvironment('VV_SCREENSHOT_MODE');

/// Mirrors packages/functions/src/warranty.provider.ts's WarrantyCoverage.
class WarrantyCoverage {
  final String type;
  final String startDate;
  final String endDate;
  final int? maxMileage;
  final int? remainingMileage;
  final String? note;

  const WarrantyCoverage({
    required this.type,
    required this.startDate,
    required this.endDate,
    required this.maxMileage,
    required this.remainingMileage,
    this.note,
  });

  factory WarrantyCoverage.fromMap(Map<String, dynamic> map) {
    return WarrantyCoverage(
      type: (map['type'] ?? '').toString(),
      startDate: (map['startDate'] ?? '').toString(),
      endDate: (map['endDate'] ?? '').toString(),
      maxMileage: (map['maxMileage'] as num?)?.round(),
      remainingMileage: (map['remainingMileage'] as num?)?.round(),
      note: (map['note'] as String?),
    );
  }
}

/// Mirrors packages/functions/src/warranty.provider.ts's WarrantySummary --
/// brandSpecific distinguishes "this app has this manufacturer's real
/// published warranty terms on file" from "no manufacturer data, showing a
/// generic industry-standard estimate"; callers must not collapse this
/// into a single undifferentiated state (same pattern as
/// MaintenancePlan.modelSpecific in maintenance_plan_service.dart).
class WarrantySummary {
  final String status;
  final String asOf;
  final List<WarrantyCoverage> coverages;
  final bool brandSpecific;
  final String notes;

  const WarrantySummary({
    required this.status,
    required this.asOf,
    required this.coverages,
    required this.brandSpecific,
    required this.notes,
  });

  factory WarrantySummary.fromMap(Map<String, dynamic> map) {
    final rawCoverages = (map['coverages'] as List?) ?? [];
    return WarrantySummary(
      status: (map['status'] ?? 'unknown').toString(),
      asOf: (map['asOf'] ?? '').toString(),
      coverages: rawCoverages
          .map(
            (c) => WarrantyCoverage.fromMap(Map<String, dynamic>.from(c as Map)),
          )
          .toList(),
      brandSpecific: map['brandSpecific'] == true,
      notes: (map['notes'] ?? '').toString(),
    );
  }

  WarrantyCoverage? coverageOfType(String type) {
    for (final c in coverages) {
      if (c.type == type) return c;
    }
    return null;
  }
}

/// e.g. "basic" -> "Basic", "ev_battery" -> "Ev Battery".
String formatCoverageTypeLabel(String type) {
  if (type == 'battery') return 'Battery & Drive Unit';
  final spaced = type.replaceAll('_', ' ');
  return spaced.replaceAllMapped(
    RegExp(r'\b\w'),
    (match) => match.group(0)!.toUpperCase(),
  );
}

/// Fetches this vehicle's warranty coverage summary (manufacturer-specific
/// terms when this app has them on file for the vehicle's make, a flagged
/// generic estimate otherwise — see
/// packages/functions/src/warranty.provider.ts) from the server.
class WarrantyService {
  final FirebaseFunctions _functions;

  WarrantyService({FirebaseFunctions? functions})
    : _functions = functions ?? FirebaseFunctions.instance;

  Future<WarrantySummary> getWarrantySummary({
    required String vin,
    int? currentMileage,
  }) async {
    if (_screenshotMode) {
      return WarrantySummary(
        status: 'active',
        asOf: '2026-07-25',
        brandSpecific: true,
        notes:
            'Reflects standard published new-vehicle limited warranty terms '
            'for the U.S. market. Certified pre-owned coverage, extended '
            'service contracts, and state lemon-law rules can all extend '
            "beyond what's shown here — see your vehicle's warranty booklet "
            'for the exact terms that apply to you.',
        coverages: const [
          WarrantyCoverage(
            type: 'basic',
            startDate: '2023-01-01',
            endDate: '2026-01-01',
            maxMileage: 36000,
            remainingMileage: 8000,
          ),
          WarrantyCoverage(
            type: 'powertrain',
            startDate: '2023-01-01',
            endDate: '2028-01-01',
            maxMileage: 60000,
            remainingMileage: 32000,
          ),
          WarrantyCoverage(
            type: 'corrosion',
            startDate: '2023-01-01',
            endDate: '2028-01-01',
            maxMileage: null,
            remainingMileage: null,
          ),
        ],
      );
    }

    final callable = _functions.httpsCallable('getWarrantySummaryCallable');
    final response = await callable.call(<String, dynamic>{
      'vin': vin,
      if (currentMileage != null) 'currentMileage': currentMileage,
    });
    final data = Map<String, dynamic>.from(response.data as Map? ?? const {});

    if (data['success'] != true) {
      throw Exception(
        data['error']?.toString() ?? 'Failed to fetch warranty summary',
      );
    }

    return WarrantySummary.fromMap(
      Map<String, dynamic>.from(data['warranty'] as Map? ?? const {}),
    );
  }
}
