import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../theme/design_tokens.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final colorScheme = AppDesignTokens.colorScheme(
      Theme.of(context).brightness,
    );

    return Scaffold(
      appBar: AppBar(title: const Text('Vehicle-Vitals')),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: ListView(
          children: [
            const SizedBox(height: 8),
            Text(
              'Stay ahead of vehicle maintenance',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 10),
            Text(
              'Keep service records and receipts together, see available maintenance recommendations, and carry the history to your next shop visit.',
              style: Theme.of(
                context,
              ).textTheme.bodyLarge?.copyWith(color: colorScheme.muted),
            ),
            const SizedBox(height: 18),
            _ActionCard(
              title: 'Already have an account?',
              subtitle: 'Open the same Garage you use on the web.',
              ctaLabel: 'Sign In',
              onPressed: () => context.go('/auth/login'),
              icon: Icons.login,
            ),
            const SizedBox(height: 12),
            _ActionCard(
              title: 'New to Vehicle-Vitals?',
              subtitle:
                  'Create an account, add a vehicle, and save your first service record.',
              ctaLabel: 'Create Account',
              onPressed: () => context.go('/auth/signup'),
              icon: Icons.person_add_alt_1,
              isPrimary: true,
            ),
            const SizedBox(height: 18),
            Text(
              'What you can do',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 10),
            const _FeatureBullet(
              text: 'Keep receipts and service proof with the right vehicle',
            ),
            const _FeatureBullet(
              text: 'Review what was completed and what may need attention',
            ),
            const _FeatureBullet(
              text: 'Use the same account on the web and iPhone',
            ),
          ],
        ),
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  const _ActionCard({
    required this.title,
    required this.subtitle,
    required this.ctaLabel,
    required this.onPressed,
    required this.icon,
    this.isPrimary = false,
  });

  final String title;
  final String subtitle;
  final String ctaLabel;
  final VoidCallback onPressed;
  final IconData icon;
  final bool isPrimary;

  @override
  Widget build(BuildContext context) {
    final muted = AppDesignTokens.colorScheme(
      Theme.of(context).brightness,
    ).muted;

    return Card(
      elevation: isPrimary ? 2 : 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: Theme.of(
                      context,
                    ).textTheme.bodyMedium?.copyWith(color: muted),
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: isPrimary
                        ? ElevatedButton(
                            onPressed: onPressed,
                            child: Text(ctaLabel),
                          )
                        : OutlinedButton(
                            onPressed: onPressed,
                            child: Text(ctaLabel),
                          ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FeatureBullet extends StatelessWidget {
  final String text;

  const _FeatureBullet({required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(top: 6),
            child: Icon(Icons.circle, size: 8),
          ),
          const SizedBox(width: 10),
          Expanded(child: Text(text)),
        ],
      ),
    );
  }
}
