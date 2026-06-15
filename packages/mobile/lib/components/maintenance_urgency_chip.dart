import 'package:flutter/material.dart';
import '../models/maintenance_schedule.dart';
import '../models/vehicle.dart';

class MaintenanceUrgencyChip extends StatelessWidget {
  final Vehicle vehicle;

  const MaintenanceUrgencyChip({
    super.key,
    required this.vehicle,
  });

  @override
  Widget build(BuildContext context) {
    final items = MaintenanceSchedule.getUpcomingMaintenance(
      vehicle.make,
      vehicle.model,
      vehicle.mileage,
      vehicle.mileage + 10000,
    );
    if (items.isEmpty) return const SizedBox.shrink();

    final miles = items.first['milesUntilDue'] as int;
    if (miles > 5000) return const SizedBox.shrink();

    final isUrgent = miles <= 1000;

    return Container(
      margin: const EdgeInsets.only(top: 4),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: isUrgent ? Colors.red.shade100 : Colors.orange.shade100,
        borderRadius: BorderRadius.circular(99),
      ),
      child: Text(
        isUrgent ? '⚠ Maintenance due!' : 'Service due soon',
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: isUrgent ? Colors.red.shade800 : Colors.orange.shade800,
        ),
      ),
    );
  }
}
