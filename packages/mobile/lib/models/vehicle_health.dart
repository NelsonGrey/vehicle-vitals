import 'maintenance.dart';
import 'vehicle.dart';

class VehicleHealthComponent {
  final String label;
  final String status;
  final String confidence;
  final double remainingPercent;
  final int? remainingMiles;
  final int? remainingDays;

  VehicleHealthComponent({
    required this.label,
    required this.status,
    required this.confidence,
    required this.remainingPercent,
    this.remainingMiles,
    this.remainingDays,
  });
}

class VehicleHealthSnapshot {
  final String vin;
  final String vehicleLabel;
  final int overallHealthScore;
  final String accuracyTip;
  final List<VehicleHealthComponent> components;

  VehicleHealthSnapshot({
    required this.vin,
    required this.vehicleLabel,
    required this.overallHealthScore,
    required this.accuracyTip,
    required this.components,
  });
}

class VehicleHealthCalculator {
  static int _parseMileage(dynamic value) {
    final parsed = int.tryParse(
      (value?.toString() ?? '').replaceAll(RegExp(r'[^0-9]'), ''),
    );
    return parsed ?? 0;
  }

  static int _daysBetween(DateTime start, DateTime end) {
    return end.difference(start).inDays.abs();
  }

  static VehicleHealthSnapshot buildSnapshot(
    Vehicle vehicle,
    List<Maintenance> maintenance, {
    DateTime? now,
  }) {
    final currentTime = now ?? DateTime.now();
    final currentMileage = vehicle.mileage;
    final components = <VehicleHealthComponent>[];

    Maintenance? latestWhere(bool Function(Maintenance item) predicate) {
      for (final entry in maintenance) {
        if (predicate(entry)) return entry;
      }
      return null;
    }

    final oil = latestWhere((item) {
      final text = '${item.title} ${item.notes}'.toLowerCase();
      return text.contains('oil') || text.contains('filter');
    });
    final rotation = latestWhere((item) {
      final text = '${item.title} ${item.notes}'.toLowerCase();
      return text.contains('rotate') || text.contains('rotation');
    });
    final tires = latestWhere((item) {
      final text = '${item.title} ${item.notes}'.toLowerCase();
      return text.contains('tire');
    });
    final brakes = latestWhere((item) {
      final text = '${item.title} ${item.notes}'.toLowerCase();
      return text.contains('brake');
    });
    final battery = latestWhere((item) {
      final text = '${item.title} ${item.notes}'.toLowerCase();
      return text.contains('battery');
    });
    final wipers = latestWhere((item) {
      final text = '${item.title} ${item.notes}'.toLowerCase();
      return text.contains('wiper') || text.contains('windshield');
    });

    VehicleHealthComponent buildComponent({
      required String label,
      required Maintenance? entry,
      required int intervalMiles,
      required int intervalDays,
    }) {
      final mileageAnchor = entry != null ? _parseMileage(entry.mileage) : 0;
      final dateAnchor = entry?.date;
      final mileageBasedRemaining =
          mileageAnchor > 0 ? intervalMiles - (currentMileage - mileageAnchor) : null;
      final dateBasedRemaining =
          dateAnchor != null ? intervalDays - _daysBetween(dateAnchor, currentTime) : null;
      final remainingPercent = [
        if (mileageBasedRemaining != null) mileageBasedRemaining / intervalMiles,
        if (dateBasedRemaining != null) dateBasedRemaining / intervalDays,
      ].fold<double>(1.0, (acc, value) => value < acc ? value : acc);

      final status = remainingPercent <= 0
          ? 'overdue'
          : remainingPercent <= 0.15
              ? 'service soon'
              : remainingPercent <= 0.35
                  ? 'watch'
                  : 'good';
      final confidence = entry != null && mileageAnchor > 0
          ? 'high'
          : entry != null
              ? 'medium'
              : 'low';

      return VehicleHealthComponent(
        label: label,
        status: status,
        confidence: confidence,
        remainingPercent: remainingPercent.clamp(-0.5, 1.0),
        remainingMiles: mileageBasedRemaining,
        remainingDays: dateBasedRemaining,
      );
    }

    components.addAll([
      buildComponent(
        label: 'Oil',
        entry: oil,
        intervalMiles: 5000,
        intervalDays: 180,
      ),
      buildComponent(
        label: 'Rotation',
        entry: rotation,
        intervalMiles: 6000,
        intervalDays: 240,
      ),
      buildComponent(
        label: 'Tires',
        entry: tires,
        intervalMiles: 50000,
        intervalDays: 1460,
      ),
      buildComponent(
        label: 'Brakes',
        entry: brakes,
        intervalMiles: 40000,
        intervalDays: 1095,
      ),
      buildComponent(
        label: 'Battery',
        entry: battery,
        intervalMiles: 45000,
        intervalDays: 1460,
      ),
      buildComponent(
        label: 'Wipers',
        entry: wipers,
        intervalMiles: 12000,
        intervalDays: 365,
      ),
    ]);

    final score = (components.fold<double>(
              0,
              (sum, component) => sum + component.remainingPercent.clamp(0, 1),
            ) /
            components.length *
            100)
        .round()
        .clamp(0, 100);

    final accuracyTip = maintenance.isEmpty
        ? 'Add your recent service entries to improve forecast accuracy.'
        : 'Keep mileage and service entries current so remaining-life estimates stay accurate.';

    return VehicleHealthSnapshot(
      vin: vehicle.vin,
      vehicleLabel: '${vehicle.year} ${vehicle.make} ${vehicle.model}',
      overallHealthScore: score,
      accuracyTip: accuracyTip,
      components: components,
    );
  }
}
