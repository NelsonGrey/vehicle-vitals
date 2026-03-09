import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../theme/design_tokens.dart';

class MarketingWelcomeScreen extends StatelessWidget {
  const MarketingWelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final colorScheme = AppDesignTokens.colorScheme(
      Theme.of(context).brightness,
    );

    return Scaffold(
      appBar: AppBar(title: const Text('Vehicle Vitals')),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),
            Text(
              'Marketing: what Vehicle Vitals delivers',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 10),
            Text(
              'Track maintenance, timeline events, and ownership history across web and mobile.',
              style: Theme.of(
                context,
              ).textTheme.bodyLarge?.copyWith(color: colorScheme.muted),
            ),
            const SizedBox(height: 20),
            const _FeatureBullet(text: 'VIN-first onboarding and quick setup'),
            const _FeatureBullet(text: 'Service timeline and upcoming tasks'),
            const _FeatureBullet(text: 'Secure account with synced data'),
            const _FeatureBullet(text: 'Cross-platform access and continuity'),
            const Spacer(),
            Text(
              'Next: authenticate to access your secure garage.',
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: colorScheme.muted),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => context.go('/auth/login'),
                    child: const Text('Sign In'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => context.go('/auth/signup'),
                    child: const Text('Create Account'),
                  ),
                ),
              ],
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
