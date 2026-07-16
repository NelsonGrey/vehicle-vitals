import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class InstructionsScreen extends StatelessWidget {
  const InstructionsScreen({super.key});

  static const _topics = <({IconData icon, String title, String content})>[
    (
      icon: Icons.add_circle_outline,
      title: 'Add your first vehicle',
      content:
          '1. Open Garage and tap Add Vehicle.\n2. Choose the vehicle type.\n3. Scan or enter the VIN, HIN, serial number, or other vehicle ID.\n4. Review any lookup result and fill in missing details.\n5. Add current mileage and tap Save Vehicle.',
    ),
    (
      icon: Icons.receipt_long_outlined,
      title: 'Save service records and receipts',
      content:
          '1. Open Garage and choose a vehicle.\n2. Open Records.\n3. Add completed work, date, mileage, cost, provider, and notes.\n4. Attach receipts, invoices, photos, or PDFs when useful.\n5. Save and confirm the record appears in Service History.',
    ),
    (
      icon: Icons.event_note_outlined,
      title: 'Use Maintenance Plan',
      content:
          '1. Tap Plan in the bottom navigation.\n2. Review available recommendations and saved reminders.\n3. Complete, snooze, dismiss, or reopen a reminder when those actions are shown.\n4. Confirm maintenance requirements with the owner’s manual or a qualified professional. Missing recommendations do not prove a vehicle is fully maintained.',
    ),
    (
      icon: Icons.history,
      title: 'Review Service History',
      content:
          '1. Tap History in the bottom navigation.\n2. Review completed work in chronological order.\n3. Open the related vehicle or record when you need details before a shop visit, warranty request, or sale.',
    ),
    (
      icon: Icons.storefront_outlined,
      title: 'Find Shops & Services',
      content:
          'Open Account, then Settings, then Shops & Services. Enter location context and choose a business type. Search results are third-party information, so confirm details with the business before visiting.',
    ),
    (
      icon: Icons.tune,
      title: 'Set reminders, calendar, and email',
      content:
          'Open Account, then Settings. Use Reminder Preferences, Calendar Preferences, and Email Preferences to control when and where maintenance information is delivered. Device permissions can also be changed in iOS Settings.',
    ),
    (
      icon: Icons.cloud_off_outlined,
      title: 'Work offline and synchronize',
      content:
          'Open Account, then Settings, then Offline Settings. Changes saved offline synchronize when the device reconnects. Clearing the local cache removes downloaded copies from this device; data already synchronized to your account remains available online.',
    ),
    (
      icon: Icons.shield_outlined,
      title: 'Export or delete account data',
      content:
          'Open Account, then Data & Privacy. Use Request Data Export for a copy of covered account data or Delete Account to start deletion. Review the confirmation carefully before submitting a deletion request.',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Help')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Follow the labels you see in the app',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          const Text(
            'The four main areas are Garage, Plan, History, and Account. These instructions use those exact names.',
          ),
          const SizedBox(height: 16),
          ..._topics.map(
            (topic) => Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: ExpansionTile(
                leading: Icon(topic.icon),
                title: Text(topic.title),
                childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                expandedCrossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(width: double.infinity, child: Text(topic.content)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Still need help?',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Tell Support what you expected, what happened, and the steps that reproduce the issue. Include your device model and iOS version. Share a VIN only when it is necessary and safe to do so.',
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    onPressed: () => context.push('/app/support'),
                    icon: const Icon(Icons.support_agent),
                    label: const Text('Open Support'),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
