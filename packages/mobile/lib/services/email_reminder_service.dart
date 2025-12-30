// import 'package:cloud_firestore/cloud_firestore.dart';
// import 'package:cloud_functions/cloud_functions.dart';
// import 'package:firebase_auth/firebase_auth.dart';

class EmailReminderService {
  // final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  // final FirebaseFunctions _functions = FirebaseFunctions.instance;

  // Get user's email reminder preferences
  Future<Map<String, dynamic>> getEmailPreferences() async {
    // Mock data for TestFlight
    return {
      'emailRemindersEnabled': false, // Disabled for TestFlight
      'email': 'test@example.com',
    };
  }

  // Update email reminder preferences
  Future<void> updateEmailPreferences(bool enabled) async {
    // Mock: do nothing for TestFlight
  }

  // Send a test maintenance reminder
  Future<void> sendTestReminder() async {
    // Mock: do nothing for TestFlight
    throw Exception('Email reminders disabled for TestFlight build');
  }
}
