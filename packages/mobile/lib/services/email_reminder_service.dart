import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';

class EmailReminderService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseFunctions _functions = FirebaseFunctions.instance;

  // Get user's email reminder preferences
  Future<Map<String, dynamic>> getEmailPreferences() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) throw Exception('User not authenticated');

    final doc = await _firestore.collection('users').doc(user.uid).get();
    final data = doc.data() ?? {};

    return {
      'emailRemindersEnabled': data['emailRemindersEnabled'] ?? true,
      'email': user.email ?? '',
    };
  }

  // Update email reminder preferences
  Future<void> updateEmailPreferences(bool enabled) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) throw Exception('User not authenticated');

    await _firestore.collection('users').doc(user.uid).update({
      'emailRemindersEnabled': enabled,
    });
  }

  // Send a test maintenance reminder
  Future<void> sendTestReminder() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) throw Exception('User not authenticated');

    final preferences = await getEmailPreferences();
    if (!preferences['emailRemindersEnabled'] || preferences['email'].isEmpty) {
      throw Exception(
        'Email reminders are disabled or no email address available',
      );
    }

    // Get user's first vehicle for testing
    final vehiclesSnapshot = await _firestore
        .collection('users')
        .doc(user.uid)
        .collection('vehicles')
        .limit(1)
        .get();

    if (vehiclesSnapshot.docs.isEmpty) {
      throw Exception('No vehicles found to test with');
    }

    final vehicle = vehiclesSnapshot.docs.first.data();
    vehicle['vin'] = vehiclesSnapshot.docs.first.id;

    // Send test reminder
    final result = await _functions
        .httpsCallable('sendMaintenanceReminder')
        .call({
          'email': preferences['email'],
          'vehicle': vehicle,
          'maintenanceItems': [
            {'title': 'Test Oil Change', 'dueDate': 'Within 1 week'},
            {'title': 'Test Tire Rotation', 'dueDate': 'Within 2 weeks'},
          ],
        });

    if (result.data['success'] != true) {
      throw Exception(result.data['error'] ?? 'Failed to send test reminder');
    }
  }
}
