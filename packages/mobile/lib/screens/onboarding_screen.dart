import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../services/firestore_service.dart';
import '../services/onboarding_service.dart';
import '../services/premium_service.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  bool _submitting = false;
  bool _loadingVehicles = true;
  String? _firstVehicleVin;

  @override
  void initState() {
    super.initState();
    _loadFirstVehicle();
  }

  Future<void> _loadFirstVehicle() async {
    try {
      final vehicles = await FirestoreService().getVehicles();
      if (!mounted) {
        return;
      }
      setState(() {
        _firstVehicleVin = vehicles.isNotEmpty ? vehicles.first.vin : null;
        _loadingVehicles = false;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() => _loadingVehicles = false);
    }
  }

  Future<void> _completeSetup() async {
    setState(() => _submitting = true);
    try {
      await context.read<OnboardingService>().markCompleted();
      if (!mounted) {
        return;
      }
      context.go('/app');
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Unable to complete setup: $error')),
      );
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  String _tierSummary(String tier) {
    switch (tier) {
      case 'pro':
        return 'Pro: expanded reminders, calendar sync, and exports';
      case 'premium':
        return 'Premium: advanced capabilities with ad-free experience';
      case 'enterprise':
        return 'Enterprise: contract-based operations and support handoff';
      case 'free':
      default:
        return 'Free: core tracking and reminders with upgrade options';
    }
  }

  @override
  Widget build(BuildContext context) {
    final premiumService = context.watch<PremiumService>();
    final tier = premiumService.subscriptionTier;
    final hasVehicle = _firstVehicleVin != null;

    return Scaffold(
      appBar: AppBar(title: const Text('Getting Started')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Add a vehicle → Log service records → Stay on top of what\'s next',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          Text(
            'Complete these setup steps now, or finish them later from Account and Settings.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 16),
          _PrimaryStepCard(
            stepNumber: 1,
            icon: Icons.directions_car_filled,
            title: 'Add your first vehicle or scan VIN',
            subtitle:
                'Create your working Garage so reminders, Records, and Service History are useful from day one.',
            actions: [
              _StepAction(
                label: 'Add vehicle',
                onTap: () => context.push('/app/add-vehicle'),
              ),
              _StepAction(
                label: 'Scan VIN',
                onTap: () => context.push('/app/scan-vin'),
              ),
            ],
          ),
          const SizedBox(height: 10),
          _PrimaryStepCard(
            stepNumber: 2,
            icon: Icons.receipt_long,
            title: 'Log a service record',
            subtitle: hasVehicle
                ? 'Add your first maintenance record so costs and history start building up.'
                : 'Unlocks once you\'ve added a vehicle.',
            actions: hasVehicle
                ? [
                    _StepAction(
                      label: 'Add records',
                      onTap: () =>
                          context.push('/app/records/$_firstVehicleVin'),
                    ),
                  ]
                : const [],
            isLoading: _loadingVehicles,
          ),
          const SizedBox(height: 10),
          _PrimaryStepCard(
            stepNumber: 3,
            icon: Icons.event_available,
            title: 'Review your Maintenance Plan',
            subtitle:
                'Review available recommendations and saved reminders. Confirm requirements with the owner’s manual.',
            actions: [
              _StepAction(
                label: 'View Maintenance Plan',
                onTap: () => context.push('/app/upcoming'),
              ),
            ],
          ),
          const SizedBox(height: 10),
          _PrimaryStepCard(
            stepNumber: 4,
            icon: Icons.history,
            title: 'Review your Service History',
            subtitle:
                'See completed work in one place once records start coming in.',
            actions: [
              _StepAction(
                label: 'View Service History',
                onTap: () => context.push('/app/timeline'),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Text(
            'More setup (optional)',
            style: Theme.of(
              context,
            ).textTheme.labelLarge?.copyWith(color: Colors.black54),
          ),
          const SizedBox(height: 6),
          Card(
            child: Column(
              children: [
                _SecondaryStepTile(
                  icon: Icons.notifications_active,
                  title: 'Set reminder preferences',
                  subtitle:
                      'Tune lead time and daily mileage assumptions to match how you use your vehicles.',
                  onTap: () => context.push('/app/reminder-preferences'),
                ),
                const Divider(height: 1),
                _SecondaryStepTile(
                  icon: Icons.storefront_outlined,
                  title: 'Find shops & services',
                  subtitle:
                      'Search and save nearby shops and services for when you need them.',
                  onTap: () => context.push('/app/service-providers'),
                ),
                const Divider(height: 1),
                _SecondaryStepTile(
                  icon: Icons.workspace_premium,
                  title: 'Review subscription options',
                  subtitle:
                      'Check what is included for your current tier and where upgrades unlock more workflows.',
                  onTap: () => context.push('/app/premium'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Current tier expectation',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                  ),
                  const SizedBox(height: 6),
                  Text(_tierSummary(tier)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _submitting ? null : _completeSetup,
            child: _submitting
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Start using Garage'),
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: _submitting ? null : _completeSetup,
            child: const Text('Skip for now'),
          ),
        ],
      ),
    );
  }
}

class _StepAction {
  const _StepAction({required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;
}

class _PrimaryStepCard extends StatelessWidget {
  const _PrimaryStepCard({
    required this.stepNumber,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.actions,
    this.isLoading = false,
  });

  final int stepNumber;
  final IconData icon;
  final String title;
  final String subtitle;
  final List<_StepAction> actions;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              radius: 14,
              backgroundColor: Theme.of(context).colorScheme.primary,
              child: Text(
                '$stepNumber',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(icon, size: 20),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          title,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 16,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(subtitle),
                  if (isLoading) ...[
                    const SizedBox(height: 10),
                    const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ] else if (actions.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: actions
                          .map(
                            (action) => OutlinedButton(
                              onPressed: action.onTap,
                              child: Text(action.label),
                            ),
                          )
                          .toList(),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SecondaryStepTile extends StatelessWidget {
  const _SecondaryStepTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, size: 20),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
      subtitle: Text(subtitle),
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }
}
