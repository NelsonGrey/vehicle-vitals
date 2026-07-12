// Manufacturer maintenance schedules data
// Hand-ported from packages/shared/src/maintenanceSchedules.js - keep both in sync.
class MaintenanceItem {
  final String id;
  final int interval; // miles
  final String description;
  final String frequency;

  const MaintenanceItem({
    required this.id,
    required this.interval,
    required this.description,
    required this.frequency,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'interval': interval,
    'description': description,
    'frequency': frequency,
  };

  factory MaintenanceItem.fromJson(Map<String, dynamic> json) =>
      MaintenanceItem(
        id: json['id'],
        interval: json['interval'],
        description: json['description'],
        frequency: json['frequency'],
      );
}

class MaintenanceSchedule {
  static const Map<String, Map<String, Map<String, MaintenanceItem>>>
  manufacturerSchedules = {
    // Toyota schedules
    'Toyota': {
      'Camry': {
        'oilChange': MaintenanceItem(
          id: 'oilChange',
          interval: 5000,
          description: 'Oil and filter change',
          frequency: 'Every 5,000 miles or 6 months',
        ),
        'tireRotation': MaintenanceItem(
          id: 'tireRotation',
          interval: 5000,
          description: 'Tire rotation',
          frequency: 'Every 5,000 miles',
        ),
        'brakeInspection': MaintenanceItem(
          id: 'brakeInspection',
          interval: 10000,
          description: 'Brake inspection',
          frequency: 'Every 10,000 miles',
        ),
        'transmissionService': MaintenanceItem(
          id: 'transmissionService',
          interval: 30000,
          description: 'Transmission fluid change',
          frequency: 'Every 30,000 miles',
        ),
      },
      'Corolla': {
        'oilChange': MaintenanceItem(
          id: 'oilChange',
          interval: 5000,
          description: 'Oil and filter change',
          frequency: 'Every 5,000 miles or 6 months',
        ),
        'tireRotation': MaintenanceItem(
          id: 'tireRotation',
          interval: 5000,
          description: 'Tire rotation',
          frequency: 'Every 5,000 miles',
        ),
        'airFilter': MaintenanceItem(
          id: 'airFilter',
          interval: 15000,
          description: 'Air filter replacement',
          frequency: 'Every 15,000 miles',
        ),
      },
    },
    // Honda schedules
    'Honda': {
      'Civic': {
        'oilChange': MaintenanceItem(
          id: 'oilChange',
          interval: 7500,
          description: 'Oil and filter change',
          frequency: 'Every 7,500 miles or 1 year',
        ),
        'tireRotation': MaintenanceItem(
          id: 'tireRotation',
          interval: 7500,
          description: 'Tire rotation',
          frequency: 'Every 7,500 miles',
        ),
        'brakeInspection': MaintenanceItem(
          id: 'brakeInspection',
          interval: 15000,
          description: 'Brake inspection',
          frequency: 'Every 15,000 miles',
        ),
      },
      'Accord': {
        'oilChange': MaintenanceItem(
          id: 'oilChange',
          interval: 7500,
          description: 'Oil and filter change',
          frequency: 'Every 7,500 miles or 1 year',
        ),
        'tireRotation': MaintenanceItem(
          id: 'tireRotation',
          interval: 7500,
          description: 'Tire rotation',
          frequency: 'Every 7,500 miles',
        ),
        'transmissionService': MaintenanceItem(
          id: 'transmissionService',
          interval: 30000,
          description: 'Transmission fluid change',
          frequency: 'Every 30,000 miles',
        ),
      },
    },
    // Ford schedules
    'Ford': {
      'F-150': {
        'oilChange': MaintenanceItem(
          id: 'oilChange',
          interval: 7500,
          description: 'Oil and filter change',
          frequency: 'Every 7,500 miles or 6 months',
        ),
        'tireRotation': MaintenanceItem(
          id: 'tireRotation',
          interval: 7500,
          description: 'Tire rotation',
          frequency: 'Every 7,500 miles',
        ),
        'brakeInspection': MaintenanceItem(
          id: 'brakeInspection',
          interval: 12500,
          description: 'Brake inspection',
          frequency: 'Every 12,500 miles',
        ),
      },
      'Explorer': {
        'oilChange': MaintenanceItem(
          id: 'oilChange',
          interval: 7500,
          description: 'Oil and filter change',
          frequency: 'Every 7,500 miles or 6 months',
        ),
        'tireRotation': MaintenanceItem(
          id: 'tireRotation',
          interval: 7500,
          description: 'Tire rotation',
          frequency: 'Every 7,500 miles',
        ),
        'airFilter': MaintenanceItem(
          id: 'airFilter',
          interval: 15000,
          description: 'Air filter replacement',
          frequency: 'Every 15,000 miles',
        ),
      },
    },
  };

  // Get maintenance schedule for a specific vehicle
  static Map<String, MaintenanceItem>? getMaintenanceSchedule(
    String? make,
    String? model,
  ) {
    if (make == null || model == null) return null;

    final makeSchedules = manufacturerSchedules[make];
    if (makeSchedules == null) return null;

    return makeSchedules[model];
  }

  // Get all available maintenance items for a vehicle
  static List<MaintenanceItem> getMaintenanceItems(
    String? make,
    String? model,
  ) {
    final schedule = getMaintenanceSchedule(make, model);
    if (schedule == null) return [];

    return schedule.values.toList();
  }

  // Calculate next due mileage based on current mileage. The next due point
  // is the next unvisited multiple of the interval strictly above
  // currentMileage — e.g. interval 10000 at currentMileage 25000 is due at
  // 30000, not 40000.
  static int calculateNextDue(int currentMileage, int interval) {
    final nextMileage = ((currentMileage / interval).floor() + 1) * interval;
    return nextMileage;
  }

  // Get upcoming maintenance items
  static List<Map<String, dynamic>> getUpcomingMaintenance(
    String? make,
    String? model,
    int currentMileage, [
    int maxMileage = 50000,
  ]) {
    final items = getMaintenanceItems(make, model);
    if (items.isEmpty) return [];

    return items
        .map((item) {
          final nextDueMileage = calculateNextDue(
            currentMileage,
            item.interval,
          );
          return {
            ...item.toJson(),
            'nextDueMileage': nextDueMileage,
            'milesUntilDue': nextDueMileage - currentMileage,
          };
        })
        .where((item) => item['nextDueMileage'] <= maxMileage)
        .toList()
      ..sort(
        (a, b) =>
            (a['nextDueMileage'] as int).compareTo(b['nextDueMileage'] as int),
      );
  }
}
