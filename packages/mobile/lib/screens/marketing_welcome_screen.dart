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
      appBar: AppBar(title: const Text('Garage')),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: ListView(
          children: [
            const SizedBox(height: 8),
            Text(
              'Welcome to your garage workspace',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 10),
            Text(
              'Jump straight into vehicles, records, and upcoming work. Sign in to continue where you left off, or create an account to get started in minutes.',
              style: Theme.of(
                context,
              ).textTheme.bodyLarge?.copyWith(color: colorScheme.muted),
            ),
            const SizedBox(height: 18),
            _ActionCard(
              title: 'Returning user',
              subtitle: 'Open your existing garage and pick up current tasks.',
              ctaLabel: 'Sign In',
              onPressed: () => context.go('/auth/login'),
              icon: Icons.login,
            ),
            const SizedBox(height: 12),
            _ActionCard(
              title: 'New user',
              subtitle:
                  'Create your account, add your first vehicle, and configure reminders.',
              ctaLabel: 'Create Account',
              onPressed: () => context.go('/auth/signup'),
              icon: Icons.person_add_alt_1,
              isPrimary: true,
            ),
            const SizedBox(height: 18),
            Text(
              'Subscription expectations',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              'Choose a tier based on workload and feature needs. You can start Free and upgrade in-app as your garage grows.',
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: colorScheme.muted),
            ),
            const SizedBox(height: 10),
            const _FeatureBullet(
              text: 'Free: core tracking, reminders, and baseline workflow',
            ),
            const _FeatureBullet(
              text:
                  'Pro: calendar sync, exports, and expanded workflow controls',
            ),
            const _FeatureBullet(
              text:
                  'Premium: ad-free experience, API access, and advanced capabilities',
            ),
            const _FeatureBullet(
              text:
                  'Enterprise: high-volume operations with contract and support handoff',
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
