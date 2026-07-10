import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class TermsScreen extends StatelessWidget {
  const TermsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Terms of Service')),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Last updated: October 2025',
              style: TextStyle(fontSize: 14, color: Colors.grey),
            ),
            SizedBox(height: 24),
            Text(
              'Acceptance of Terms',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            SizedBox(height: 8),
            Text(
              'By using Vehicle Vitals, you agree to these Terms of Service. If you do not agree to these terms, please do not use our service.',
              style: TextStyle(fontSize: 16),
            ),
            SizedBox(height: 16),
            Text(
              'Description of Service',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            SizedBox(height: 8),
            Text(
              'Vehicle Vitals is a mobile and web application that helps users track vehicle information, maintenance records, and associated data.',
              style: TextStyle(fontSize: 16),
            ),
            SizedBox(height: 16),
            Text(
              'User Responsibilities',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            SizedBox(height: 8),
            Text(
              'Users are responsible for:\n'
              '• Providing accurate vehicle and maintenance information\n'
              '• Maintaining the security of their account credentials\n'
              '• Using the service in compliance with applicable laws\n'
              '• Not sharing account access with unauthorized parties',
              style: TextStyle(fontSize: 16),
            ),
            SizedBox(height: 16),
            Text(
              'Limitation of Liability',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            SizedBox(height: 8),
            Text(
              'Vehicle Vitals is provided "as is" without warranties. We are not liable for any damages arising from use of the service.',
              style: TextStyle(fontSize: 16),
            ),
            SizedBox(height: 16),
            Text('Support', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            const Text(
              'Questions about these Terms of Service?',
              style: TextStyle(fontSize: 16),
            ),
            TextButton(
              onPressed: () => context.push('/app/support'),
              style: TextButton.styleFrom(
                padding: EdgeInsets.zero,
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: const Text('Visit Support'),
            ),
          ],
        ),
      ),
    );
  }
}
