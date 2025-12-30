import 'package:flutter/material.dart';

class InstructionsScreen extends StatelessWidget {
  const InstructionsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Instructions')),
      body: const SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'How to Use Vehicle Vitals',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 24),

            _InstructionSection(
              icon: Icons.add_circle,
              title: 'Adding a Vehicle',
              content:
                  '1. Tap the "+" button on the home screen\n'
                  '2. Either scan the VIN barcode or enter it manually\n'
                  '3. Fill in vehicle details (make, model, year, mileage)\n'
                  '4. Tap "Save Vehicle" to add it to your collection',
            ),

            _InstructionSection(
              icon: Icons.build,
              title: 'Managing Maintenance',
              content:
                  '1. Tap on a vehicle from your home screen\n'
                  '2. Tap "View Maintenance" to see all maintenance records\n'
                  '3. Add new maintenance entries with title, notes, and cost\n'
                  '4. Tap on existing entries to edit or delete them',
            ),

            _InstructionSection(
              icon: Icons.qr_code_scanner,
              title: 'VIN Scanning',
              content:
                  '1. When adding a vehicle, tap "Scan VIN"\n'
                  '2. Point your camera at the VIN barcode\n'
                  '3. The app will automatically detect and enter the VIN\n'
                  '4. You can also enter the VIN manually if scanning fails',
            ),

            _InstructionSection(
              icon: Icons.edit,
              title: 'Editing Vehicles',
              content:
                  '1. Tap on a vehicle from your home screen\n'
                  '2. Tap "Edit Vehicle" to modify details\n'
                  '3. Update any information as needed\n'
                  '4. Tap "Save Changes" to update the vehicle',
            ),

            _InstructionSection(
              icon: Icons.account_circle,
              title: 'Account Management',
              content:
                  '1. Access your account from the navigation menu\n'
                  '2. View your account information and settings\n'
                  '3. Reset your password if needed\n'
                  '4. Sign out when finished using the app',
            ),

            SizedBox(height: 24),
            Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.help_outline, color: Colors.blue),
                        SizedBox(width: 8),
                        Text(
                          'Need Help?',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 8),
                    Text(
                      'If you need additional assistance, please contact our support team at support@vehiclevitals.app',
                      style: TextStyle(fontSize: 16),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InstructionSection extends StatelessWidget {
  final IconData icon;
  final String title;
  final String content;

  const _InstructionSection({
    required this.icon,
    required this.title,
    required this.content,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: Colors.blue),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(content, style: const TextStyle(fontSize: 16)),
          ],
        ),
      ),
    );
  }
}
