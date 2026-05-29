import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../services/onboarding_service.dart';
import '../services/premium_service.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  bool _submitting = false;

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

    return Scaffold(
      appBar: AppBar(title: const Text('Setup your workspace')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Start productive in a few minutes',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          Text(
            'Complete these setup steps now, or finish them later from Profile and Settings.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 16),
          _SetupStepCard(
            icon: Icons.directions_car_filled,
            title: 'Add your first vehicle',
            subtitle:
                'Create your working garage so reminders, records, and timeline are useful from day one.',
            buttonLabel: 'Add vehicle',
            onTap: () => context.push('/app/add-vehicle'),
          ),
          const SizedBox(height: 10),
          _SetupStepCard(
            icon: Icons.notifications_active,
            title: 'Set reminder preferences',
            subtitle:
                'Tune lead time and daily mileage assumptions to match how you use your vehicles.',
            buttonLabel: 'Set reminders',
            onTap: () => context.push('/app/reminder-preferences'),
          ),
          const SizedBox(height: 10),
          _SetupStepCard(
            icon: Icons.workspace_premium,
            title: 'Review subscription options',
            subtitle:
                'Check what is included for your current tier and where upgrades unlock more workflows.',
            buttonLabel: 'Review subscriptions',
            onTap: () => context.push('/app/premium'),
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

class _SetupStepCard extends StatelessWidget {
  const _SetupStepCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.buttonLabel,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final String buttonLabel;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 24),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(subtitle),
                  const SizedBox(height: 10),
                  OutlinedButton(onPressed: onTap, child: Text(buttonLabel)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
