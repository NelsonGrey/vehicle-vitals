import 'package:cloud_functions/cloud_functions.dart';

/// Mirrors packages/functions/src/schedule.provider.ts's MaintenancePlanItem.
class MaintenancePlanItem {
  final String serviceType;
  final int intervalMiles;
  final int intervalMonths;
  final int nextDueMileage;
  final String nextDueDate;

  const MaintenancePlanItem({
    required this.serviceType,
    required this.intervalMiles,
    required this.intervalMonths,
    required this.nextDueMileage,
    required this.nextDueDate,
  });

  factory MaintenancePlanItem.fromMap(Map<String, dynamic> map) {
    return MaintenancePlanItem(
      serviceType: (map['serviceType'] ?? '').toString(),
      intervalMiles: (map['intervalMiles'] as num?)?.round() ?? 0,
      intervalMonths: (map['intervalMonths'] as num?)?.round() ?? 12,
      nextDueMileage: (map['nextDueMileage'] as num?)?.round() ?? 0,
      nextDueDate: (map['nextDueDate'] ?? '').toString(),
    );
  }
}

/// Mirrors packages/functions/src/schedule.provider.ts's MaintenancePlan —
/// modelSpecific distinguishes "we have real manufacturer data for your
/// vehicle" from "no manufacturer data, showing a generic estimate";
/// callers must not collapse this into a single undifferentiated state.
class MaintenancePlan {
  final bool modelSpecific;
  final List<MaintenancePlanItem> items;

  const MaintenancePlan({required this.modelSpecific, required this.items});

  factory MaintenancePlan.fromMap(Map<String, dynamic> map) {
    final rawItems = (map['items'] as List?) ?? [];
    return MaintenancePlan(
      modelSpecific: map['modelSpecific'] == true,
      items: rawItems
          .map(
            (item) =>
                MaintenancePlanItem.fromMap(Map<String, dynamic>.from(item as Map)),
          )
          .toList(),
    );
  }
}

/// e.g. "oil_change" -> "Oil Change".
String formatServiceTypeLabel(String serviceType) {
  final spaced = serviceType.replaceAll('_', ' ');
  return spaced.replaceAllMapped(
    RegExp(r'\b\w'),
    (match) => match.group(0)!.toUpperCase(),
  );
}

/// Fetches the maintenance plan (manufacturer-specific intervals when this
/// app has them on file for the vehicle's make/model, a generic template
/// otherwise — see packages/functions/src/schedule.provider.ts) from the
/// server, replacing the local-only MaintenanceSchedule.getUpcomingMaintenance,
/// which only ever covered a hardcoded 6 vehicles and had no fallback for
/// anything else.
class MaintenancePlanService {
  final FirebaseFunctions _functions;

  MaintenancePlanService({FirebaseFunctions? functions})
    : _functions = functions ?? FirebaseFunctions.instance;

  Future<MaintenancePlan> getMaintenancePlan({
    required String vin,
    required int currentMileage,
    String? make,
    String? model,
  }) async {
    final callable = _functions.httpsCallable('getMaintenancePlanCallable');
    final response = await callable.call(<String, dynamic>{
      'vin': vin,
      'currentMileage': currentMileage,
      if (make != null && make.isNotEmpty) 'make': make,
      if (model != null && model.isNotEmpty) 'model': model,
    });
    final data = Map<String, dynamic>.from(response.data as Map? ?? const {});

    if (data['success'] != true) {
      throw Exception(
        data['error']?.toString() ?? 'Failed to fetch maintenance plan',
      );
    }

    return MaintenancePlan.fromMap(
      Map<String, dynamic>.from(data['plan'] as Map? ?? const {}),
    );
  }
}
