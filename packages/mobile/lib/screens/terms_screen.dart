import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class TermsScreen extends StatelessWidget {
  const TermsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Terms of Use')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Last updated: July 16, 2026',
            style: TextStyle(color: Colors.grey),
          ),
          const SizedBox(height: 12),
          Card(
            color: Colors.amber.withValues(alpha: 0.12),
            child: const Padding(
              padding: EdgeInsets.all(12),
              child: Text(
                'These terms are synchronized across web and iPhone for product review. Final legal approval is required before public launch.',
              ),
            ),
          ),
          const _TermsSection(
            title: '1. Acceptance',
            body:
                'By accessing or using Vehicle-Vitals, you agree to these Terms of Use and the Privacy Policy. If you do not agree, do not use the service. Vehicle-Vitals is a product of Nelson Grey LLC.',
          ),
          const _TermsSection(
            title: '2. The service',
            body:
                'Vehicle-Vitals provides tools for vehicle profiles, maintenance records, reminders, history, attachments, exports, provider context, and related account features. Features, availability, limits, and supported platforms may change. Planned capabilities are not guaranteed until released.',
          ),
          const _TermsSection(
            title: '3. Accounts and acceptable use',
            body:
                'Protect your credentials, provide accurate information, comply with applicable laws, and do not disrupt, probe, reverse engineer, misuse, or attempt unauthorized access to the service. Do not upload unlawful content or content you do not have the right to use.',
          ),
          const _TermsSection(
            title: '4. Vehicle information and maintenance guidance',
            body:
                'Vehicle lookups, health indicators, reminders, schedules, cost estimates, AI-assisted output, and maintenance suggestions are informational estimates and may be incomplete or incorrect. Vehicle-Vitals does not replace the owner’s manual, manufacturer guidance, inspections, recalls, qualified diagnosis, or professional service. You remain responsible for safe operation and maintenance decisions.',
          ),
          const _TermsSection(
            title: '5. Your content and privacy',
            body:
                'You remain responsible for information and files you submit and grant the rights needed to host, process, synchronize, analyze, and present that content to provide the service. Personal and vehicle information is handled under the Privacy Policy.',
          ),
          const _TermsSection(
            title: '6. Subscriptions and payments',
            body:
                'Paid subscriptions will be offered only when enabled for the applicable platform. Before purchase, Apple or another checkout provider will show price, billing period, renewal, and cancellation terms. Purchases, renewals, taxes, refunds, disputes, and cancellations may also be governed by that provider’s terms.',
          ),
          const _TermsSection(
            title: '7. Third-party services',
            body:
                'Authentication, vehicle lookups, shops, location results, calendars, email, notifications, analytics, advertising, payments, and AI-assisted features may rely on third parties. Vehicle-Vitals does not control their availability, content, or independent terms.',
          ),
          const _TermsSection(
            title: '8. Suspension, termination, and deletion',
            body:
                'You may stop using the service and request account deletion. Access may be restricted or terminated to protect users or the service, address violations, comply with law, or discontinue the service. Applicable retention obligations may continue afterward.',
          ),
          const _TermsSection(
            title: '9. Disclaimers and liability',
            body:
                'The service is provided “as is” and “as available” to the maximum extent permitted by law. We do not warrant uninterrupted operation or the accuracy of third-party or maintenance data. To the maximum extent permitted by law, Vehicle-Vitals and Nelson Grey LLC are not liable for indirect, incidental, special, consequential, or punitive damages arising from use of the service.',
          ),
          const _TermsSection(
            title: '10. Changes and contact',
            body:
                'We may update these terms and will update the date above. Material changes will be communicated when required.',
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => context.push('/support'),
            child: const Text('Contact Support'),
          ),
        ],
      ),
    );
  }
}

class _TermsSection extends StatelessWidget {
  const _TermsSection({required this.title, required this.body});
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Text(body),
        ],
      ),
    );
  }
}
