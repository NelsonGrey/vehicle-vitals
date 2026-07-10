import 'package:flutter/material.dart';

import '../models/vehicle_health.dart';
import '../theme/design_tokens.dart';

/// Health score badge, shared between the Home garage list (compact) and
/// the Vehicle Detail full breakdown (regular).
class HealthScoreBadge extends StatelessWidget {
  const HealthScoreBadge({
    super.key,
    required this.score,
    this.compact = false,
  });

  final int score;
  final bool compact;

  static Color colorFor(BuildContext context, int score) {
    final colorScheme = Theme.of(context).colorScheme;
    if (score >= 80) return AppDesignTokens.success;
    if (score >= 50) return colorScheme.tertiary;
    return colorScheme.error;
  }

  @override
  Widget build(BuildContext context) {
    final color = colorFor(context, score);
    final badge = Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 6 : 12,
        vertical: compact ? 3 : 8,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.monitor_heart, color: color, size: compact ? 12 : 16),
          const SizedBox(width: 3),
          Text(
            compact ? '$score' : '$score/100',
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.bold,
              fontSize: compact ? 12 : 18,
            ),
          ),
        ],
      ),
    );

    return Tooltip(
      message: 'Vehicle health score: $score out of 100',
      child: badge,
    );
  }
}

/// Per-component forecast card (Oil, Rotation, Tires, Brakes, Battery,
/// Wipers), shown in a Wrap on the Vehicle Detail health breakdown.
class HealthComponentCard extends StatelessWidget {
  const HealthComponentCard({super.key, required this.component});

  final VehicleHealthComponent component;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final color = component.status == 'overdue'
        ? colorScheme.error
        : component.status == 'service soon'
        ? colorScheme.tertiary
        : component.status == 'watch'
        ? Colors.amber
        : AppDesignTokens.success;

    final remainingPercent = component.remainingPercent;

    return SizedBox(
      width: 150,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(12.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                component.label,
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                remainingPercent != null
                    ? '${(remainingPercent.clamp(0, 1) * 100).round()}% left'
                    : 'Estimate only',
                style: TextStyle(fontSize: 22, color: color),
              ),
              const SizedBox(height: 6),
              Text(
                component.status,
                style: const TextStyle(fontSize: 12, color: Colors.grey),
              ),
              const SizedBox(height: 6),
              Text(
                component.remainingMiles != null
                    ? '${component.remainingMiles} mi'
                    : component.remainingDays != null
                    ? '${component.remainingDays} days'
                    : 'Estimate only',
                style: const TextStyle(fontSize: 12),
              ),
              const SizedBox(height: 4),
              Text(
                '\$${component.costLow}-\$${component.costHigh}',
                style: const TextStyle(fontSize: 12, color: Colors.grey),
              ),
              const SizedBox(height: 4),
              Text(
                component.confidence,
                style: const TextStyle(fontSize: 12, color: Colors.grey),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
