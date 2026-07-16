import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../services/onboarding_service.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _busy = false;

  Future<void> _rerunSetup() async {
    setState(() => _busy = true);

    try {
      await context.read<OnboardingService>().resetForCurrentUser();
      if (mounted) {
        context.go('/app/onboarding');
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Unable to restart setup: $error')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _busy = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final onboardingService = context.watch<OnboardingService>();

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        'Preferences',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 16),
                      ListTile(
                        leading: const Icon(Icons.email),
                        title: const Text('Email Preferences'),
                        subtitle: const Text('Manage maintenance reminders'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => context.push('/app/email-preferences'),
                      ),
                      ListTile(
                        leading: const Icon(Icons.calendar_today),
                        title: const Text('Calendar Preferences'),
                        subtitle: const Text('Sync maintenance to calendar'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => context.push('/app/calendar-preferences'),
                      ),
                      ListTile(
                        leading: const Icon(Icons.tune),
                        title: const Text('Reminder Preferences'),
                        subtitle: const Text(
                          'Lead time and daily mileage settings',
                        ),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => context.push('/app/reminder-preferences'),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        'More',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 16),
                      ListTile(
                        leading: const Icon(Icons.star),
                        title: const Text('Plans & Billing'),
                        subtitle: const Text(
                          'Review your current tier and available plans',
                        ),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => context.push('/app/premium'),
                      ),
                      ListTile(
                        leading: const Icon(Icons.wifi_off),
                        title: const Text('Offline Settings'),
                        subtitle: const Text('Manage offline data access'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => context.push('/app/offline-settings'),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        'Setup',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        onboardingService.isCompleted
                            ? 'Initial setup is complete. You can run setup again any time.'
                            : 'Initial setup is still available. Continue setup to tune reminders and subscription options.',
                      ),
                      const SizedBox(height: 12),
                      OutlinedButton.icon(
                        onPressed: _busy ? null : _rerunSetup,
                        icon: const Icon(Icons.restart_alt),
                        label: const Text('Re-run Setup'),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
