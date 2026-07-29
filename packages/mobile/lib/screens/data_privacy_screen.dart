import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../services/auth_service.dart';
import '../utils/user_facing_error.dart';

class DataPrivacyScreen extends StatefulWidget {
  const DataPrivacyScreen({super.key});

  @override
  State<DataPrivacyScreen> createState() => _DataPrivacyScreenState();
}

class _DataPrivacyScreenState extends State<DataPrivacyScreen> {
  bool _busy = false;

  Future<void> _requestDataExport() async {
    setState(() => _busy = true);
    try {
      final authService = context.read<AuthService>();
      await authService.requestAccountDataExport();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Your data export is ready. Contact Support if you need help '
              'retrieving it.',
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              userFacingError(
                e,
                fallback:
                    'The data export request could not be filed. Please try again or contact Support.',
              ),
            ),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _busy = false);
      }
    }
  }

  Future<void> _requestAccountDeletion() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Delete Account'),
        content: const Text(
          'This immediately and permanently deletes your account and all '
          'associated vehicle, maintenance, and subscription data. This '
          'cannot be undone, and you will be signed out right away.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text('Delete My Account'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    setState(() => _busy = true);
    try {
      final authService = context.read<AuthService>();
      await authService.requestAccountDataDeletion();
      // The account no longer exists server-side at this point -- the
      // local Firebase Auth session is stale. Sign out immediately rather
      // than leaving the app in a state that looks signed-in but isn't.
      await authService.signOut();
      if (mounted) {
        context.go('/welcome');
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Your account and all data have been deleted.'),
          ),
        );
      }
      return;
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              userFacingError(
                e,
                fallback:
                    'The deletion request could not be filed. No account data was changed. Please try again or contact Support.',
              ),
            ),
          ),
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
    return Scaffold(
      appBar: AppBar(title: const Text('Data & Privacy')),
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
                        'Privacy & Data Requests',
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(
                              color: Theme.of(context).colorScheme.error,
                            ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Request a copy of your data, or request deletion of '
                        'your account and all associated vehicle, '
                        'maintenance, and subscription data. Account '
                        'deletion is immediate and permanent: your account '
                        'and all associated data are deleted right away and '
                        'you are signed out automatically. This cannot be '
                        'undone.',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      const SizedBox(height: 12),
                      OutlinedButton.icon(
                        onPressed: _busy ? null : _requestDataExport,
                        icon: const Icon(Icons.download),
                        label: const Text('Request My Data Export'),
                      ),
                      const SizedBox(height: 8),
                      OutlinedButton.icon(
                        onPressed: _busy ? null : _requestAccountDeletion,
                        icon: const Icon(Icons.delete_forever),
                        label: const Text('Request Account Deletion'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Theme.of(context).colorScheme.error,
                          side: BorderSide(
                            color: Theme.of(context).colorScheme.error,
                          ),
                        ),
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
