import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../theme/design_tokens.dart';

/// Shown on the Garage screen when the user has zero vehicles at all (a
/// reachable state: onboarding can be skipped, and a user's only vehicle
/// can be deleted). Mirrors the "No vehicles yet" pattern already proven on
/// web (packages/web/src/pages/Home.tsx) so first-run copy/IA stays
/// consistent across platforms.
class GarageEmptyState extends StatelessWidget {
  const GarageEmptyState({super.key, required this.onAddVehicle});

  final VoidCallback onAddVehicle;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return SingleChildScrollView(
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(AppDesignTokens.space5),
        decoration: BoxDecoration(
          color: colorScheme.surface,
          borderRadius: BorderRadius.circular(AppDesignTokens.radiusXl),
          border: Border.all(color: colorScheme.outline),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('No vehicles yet', style: textTheme.headlineSmall),
            const SizedBox(height: AppDesignTokens.space2),
            Text(
              'Get started by adding your first vehicle. Track service, '
              'costs, and what’s due next, all in one place.',
              style: textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: AppDesignTokens.space4),
            ElevatedButton.icon(
              onPressed: onAddVehicle,
              icon: const Icon(Icons.add),
              label: const Text('Add your first vehicle'),
            ),
            const SizedBox(height: AppDesignTokens.space5),
            Container(height: 1, color: colorScheme.outline),
            const SizedBox(height: AppDesignTokens.space4),
            Text(
              'Add a vehicle → Track service and costs → Stay on '
              'top of what’s next',
              style: textTheme.labelLarge,
            ),
            const SizedBox(height: AppDesignTokens.space3),
            _EmptyStateStep(
              number: 1,
              active: true,
              title: 'Add your first vehicle',
              subtitle: 'Enter a VIN or vehicle details to start your garage.',
              onTap: onAddVehicle,
            ),
            const SizedBox(height: AppDesignTokens.space3),
            _EmptyStateStep(
              number: 2,
              active: false,
              title: 'Log your first service record',
              subtitle:
                  'Unlocks once you’ve added a vehicle — track '
                  'costs, dates, and documents.',
            ),
            const SizedBox(height: AppDesignTokens.space3),
            _EmptyStateStep(
              number: 3,
              active: true,
              title: 'Review upcoming maintenance',
              subtitle: 'See what’s due next once your garage has vehicles.',
              onTap: () => context.push('/app/upcoming'),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyStateStep extends StatelessWidget {
  const _EmptyStateStep({
    required this.number,
    required this.active,
    required this.title,
    required this.subtitle,
    this.onTap,
  });

  final int number;
  final bool active;
  final String title;
  final String subtitle;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final content = Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        CircleAvatar(
          radius: 12,
          backgroundColor: active ? colorScheme.primary : colorScheme.outline,
          child: Text(
            '$number',
            style: TextStyle(
              color: active
                  ? colorScheme.onPrimary
                  : colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w700,
              fontSize: 12,
            ),
          ),
        ),
        const SizedBox(width: AppDesignTokens.space3),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  color: active ? colorScheme.primary : null,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 12,
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      ],
    );

    if (onTap == null) return content;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppDesignTokens.radiusBase),
      child: content,
    );
  }
}
