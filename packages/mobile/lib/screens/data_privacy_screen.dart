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
      final result = await authService.requestAccountDataExport();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Data export request filed (request ${result['requestId']}). '
              "We'll notify you when it's ready.",
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
          'This will immediately and permanently delete your account and '
          'all associated vehicle, maintenance, and subscription data, and '
          'sign you out. This cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text('Delete Account'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    setState(() => _busy = true);
    try {
      final authService = context.read<AuthService>();
      try {
        await authService.requestAccountDataDeletion();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                userFacingError(
                  e,
                  fallback:
                      'The account could not be deleted. No account data was changed. Please try again or contact Support.',
                ),
              ),
            ),
          );
        }
        return;
      }

      // The callable above already deleted all Firestore/Storage data and
      // the Firebase Auth user itself server-side -- the account is gone
      // regardless of what happens next, so a signOut() failure here must
      // not be reported as if deletion itself failed. signOut() itself
      // retries the underlying SDK call and always clears local state, but
      // can still throw if the device's persisted credential could not be
      // fully cleared -- that's real, actionable information (unlike a
      // plain deletion failure), so it gets its own distinct message
      // instead of being swallowed.
      String? signOutWarning;
      try {
        await authService.signOut();
      } catch (e) {
        signOutWarning = userFacingError(
          e,
          fallback:
              'Signed out of this session, but could not fully clear the device credential. Please close the app completely to finish signing out.',
        );
      }
      if (mounted) {
        context.go('/auth/login');
        if (signOutWarning != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(signOutWarning), duration: const Duration(seconds: 8)),
          );
        }
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
                        label: const Text('Delete Account'),
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
