import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../components/app_bottom_nav.dart';
import '../firebase_options.dart';
import '../services/auth_service.dart';
import '../services/onboarding_service.dart';

class AccountScreen extends StatefulWidget {
  const AccountScreen({super.key});

  @override
  State<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends State<AccountScreen> {
  final _emailController = TextEditingController();
  bool _busy = false;

  String _formatProvider(String providerId) {
    switch (providerId) {
      case 'password':
        return 'Email/Password';
      case 'apple.com':
        return 'Apple';
      case 'google.com':
        return 'Google';
      default:
        return providerId;
    }
  }

  @override
  void initState() {
    super.initState();
    final authService = context.read<AuthService>();
    _emailController.text = authService.currentUser?.email ?? '';
  }

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _signOut() async {
    try {
      final authService = context.read<AuthService>();
      await authService.signOut();
      if (mounted) {
        context.go('/auth/login');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error signing out: $e')));
      }
    }
  }

  Future<void> _resetPassword() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter email to send a reset link')),
      );
      return;
    }

    setState(() => _busy = true);

    try {
      final authService = context.read<AuthService>();
      await authService.resetPassword(email);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Check your inbox for a reset link')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to send reset email: $e')),
        );
      }
    } finally {
      setState(() => _busy = false);
    }
  }

  Future<void> _linkApple() async {
    setState(() => _busy = true);

    try {
      final authService = context.read<AuthService>();
      await authService.linkCurrentUserWithApple();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Apple sign-in linked to this account')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Unable to link Apple sign-in: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _busy = false);
      }
    }
  }

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
    final authService = context.watch<AuthService>();
    final onboardingService = context.watch<OnboardingService>();
    final user = authService.currentUser;
    final firebaseOptions = Firebase.app().options;
    final providerLabels =
        user?.providerIds.map(_formatProvider).toSet().toList() ??
        const <String>[];
    final appleLinked = user?.providerIds.contains('apple.com') ?? false;

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
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
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Profile Overview',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'User Information',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),
                      if (user != null) ...[
                        Text('Email: ${user.email}'),
                        const SizedBox(height: 8),
                        Text('User ID: ${user.uid}'),
                        const SizedBox(height: 8),
                        Text(
                          'Email Verified: ${user.emailVerified ? "Yes" : "No"}',
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Linked providers: ${providerLabels.isEmpty ? 'Unknown' : providerLabels.join(', ')}',
                        ),
                        const SizedBox(height: 12),
                        if (!appleLinked)
                          OutlinedButton.icon(
                            onPressed: _busy ? null : _linkApple,
                            icon: const Icon(Icons.link),
                            label: const Text('Link Apple Sign-In'),
                          ),
                        const SizedBox(height: 16),
                        const Divider(),
                        const SizedBox(height: 12),
                        const Text(
                          'Data Sync Identity',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Environment: ${DefaultFirebaseOptions.currentEnvironmentLabel}',
                        ),
                        const SizedBox(height: 4),
                        Text('Firebase Project: ${firebaseOptions.projectId}'),
                        const SizedBox(height: 4),
                        Text('Auth UID: ${user.uid}'),
                        const SizedBox(height: 8),
                        const Text(
                          'Vehicles sync across web and iOS only when both apps use the same Firebase project and this same Auth UID.',
                          style: TextStyle(fontSize: 12, color: Colors.black54),
                        ),
                      ] else ...[
                        const Text('Not signed in'),
                      ],
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
                      const Text(
                        'Notifications',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
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
                      ListTile(
                        leading: const Icon(Icons.build_circle),
                        title: const Text('Mechanics'),
                        subtitle: const Text(
                          'Find nearby mechanics and dealerships',
                        ),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => context.push('/app/service-providers'),
                      ),
                      ListTile(
                        leading: const Icon(Icons.star),
                        title: const Text('Premium Features'),
                        subtitle: const Text(
                          'Remove ads and unlock advanced features',
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
                      ListTile(
                        leading: const Icon(Icons.analytics),
                        title: const Text('Analytics'),
                        subtitle: const Text('View usage insights'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => context.push('/app/analytics'),
                      ),
                      ListTile(
                        leading: const Icon(Icons.timeline),
                        title: const Text('Timeline Dashboard'),
                        subtitle: const Text('View maintenance history stream'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => context.push('/app/timeline'),
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
                      const Text(
                        'Password Reset',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _emailController,
                        decoration: const InputDecoration(
                          labelText: 'Email',
                          border: OutlineInputBorder(),
                        ),
                        keyboardType: TextInputType.emailAddress,
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _busy ? null : _resetPassword,
                        child: _busy
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : const Text('Send Reset Email'),
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
                      const Text(
                        'Setup',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
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
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _signOut,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  foregroundColor: Colors.white,
                ),
                child: const Text('Sign Out'),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: const AppBottomNav(currentIndex: 3),
    );
  }
}
