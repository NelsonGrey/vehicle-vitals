import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../components/app_bottom_nav.dart';
import '../firebase_options.dart';
import '../services/auth_service.dart';

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

  @override
  Widget build(BuildContext context) {
    final authService = context.watch<AuthService>();
    final user = authService.currentUser;
    final firebaseOptions = Firebase.app().options;
    final providerLabels =
        user?.providerIds.map(_formatProvider).toSet().toList() ??
        const <String>[];
    final appleLinked = user?.providerIds.contains('apple.com') ?? false;

    return Scaffold(
      appBar: AppBar(title: const Text('Account')),
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
                      Text(
                        'Account Overview',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'User Information',
                        style: Theme.of(context).textTheme.titleMedium,
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
                        Text(
                          'Data Sync Identity',
                          style: Theme.of(context).textTheme.titleSmall,
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
                      Text(
                        'Password Reset',
                        style: Theme.of(context).textTheme.titleMedium,
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
                      Text(
                        'Support & Legal',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 16),
                      ListTile(
                        leading: const Icon(Icons.help_outline),
                        title: const Text('Help'),
                        subtitle: const Text('Tips for using Vehicle Vitals'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => context.push('/app/instructions'),
                      ),
                      ListTile(
                        leading: const Icon(Icons.support_agent),
                        title: const Text('Support'),
                        subtitle: const Text(
                          'Get help with a question or issue',
                        ),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => context.push('/app/support'),
                      ),
                      ListTile(
                        leading: const Icon(Icons.privacy_tip_outlined),
                        title: const Text('Privacy'),
                        subtitle: const Text('How we handle your data'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => context.push('/app/privacy'),
                      ),
                      ListTile(
                        leading: const Icon(Icons.description_outlined),
                        title: const Text('Terms'),
                        subtitle: const Text('Terms of service'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => context.push('/app/terms'),
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
                        'Manage',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 16),
                      ListTile(
                        leading: const Icon(Icons.settings_outlined),
                        title: const Text('Settings'),
                        subtitle: const Text(
                          'Preferences, Shops & Services, Premium, and more',
                        ),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => context.push('/app/settings'),
                      ),
                      ListTile(
                        leading: const Icon(Icons.shield_outlined),
                        title: const Text('Data & Privacy'),
                        subtitle: const Text(
                          'Export or delete your account data',
                        ),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => context.push('/app/data-privacy'),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _signOut,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Theme.of(context).colorScheme.error,
                  foregroundColor: Theme.of(context).colorScheme.onError,
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
