import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class PrivacyScreen extends StatelessWidget {
  const PrivacyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Privacy Policy')),
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
                'This policy describes the product’s current data categories and controls. Final legal approval is required before public launch.',
              ),
            ),
          ),
          const _LegalSection(
            title: 'Information we collect',
            body:
                '• Account and authentication information\n• Vehicle IDs, make, model, year, mileage, nickname, and photos\n• Maintenance records, costs, notes, providers, receipts, invoices, PDFs, and other attachments\n• Reminder, notification, calendar, email, location-search, and offline-sync preferences\n• Support requests\n• Device, diagnostics, analytics, advertising-consent, and feature-usage information\n• Subscription and entitlement status; payment providers process payment details',
          ),
          const _LegalSection(
            title: 'How we use information',
            body:
                'We use information to provide, secure, synchronize, support, and improve Vehicle-Vitals; show your Garage, Records, Service History, and Maintenance Plan; deliver requested reminders, notifications, email, calendar actions, exports, and analysis; process account and support requests; measure reliability; prevent abuse; and show advertising where enabled and consented to.',
          ),
          const _LegalSection(
            title: 'Service providers and sharing',
            body:
                'We do not sell personal information. Service providers may process the information needed for hosting, authentication, storage, analytics, advertising, support, notifications, vehicle-data lookup, document or AI-assisted processing, and payments. Information may also be disclosed when required by law or needed to protect users or the service.',
          ),
          const _LegalSection(
            title: 'Your choices',
            body:
                'Review and update information in the app; control optional consent and device permissions; request a data export or account deletion from Data & Privacy; or contact Support with an access, correction, deletion, or other privacy request.',
          ),
          const _LegalSection(
            title: 'Retention, security, and processing',
            body:
                'Information is retained while needed to provide the service and meet legal, security, fraud-prevention, transaction, and dispute obligations. We use administrative and technical safeguards, but no method is completely secure. Information may be processed where our service providers operate. The final retention schedule and request timeline require legal approval.',
          ),
          const _LegalSection(
            title: 'Children and changes',
            body:
                'Vehicle-Vitals is not directed to children under the age required to consent to online services in their location. We may update this policy and will update the date above when we do.',
          ),
          const SizedBox(height: 4),
          ElevatedButton(
            onPressed: () => context.push('/support'),
            child: const Text('Contact Support'),
          ),
        ],
      ),
    );
  }
}

class _LegalSection extends StatelessWidget {
  const _LegalSection({required this.title, required this.body});
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
