import 'dart:convert';
import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';

const bool _screenshotMode = bool.fromEnvironment('VV_SCREENSHOT_MODE');

class EmailReminderService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  static const String _functionsBaseUrl = String.fromEnvironment(
    'FUNCTIONS_BASE_URL',
    defaultValue: '',
  );

  String get _userId {
    final user = _auth.currentUser;
    if (user == null) {
      throw Exception('Not authenticated');
    }
    return user.uid;
  }

  String _resolveFunctionsBaseUrl() {
    final explicit = _functionsBaseUrl.trim();
    if (explicit.isNotEmpty) {
      return explicit.replaceAll(RegExp(r'/+$'), '');
    }
    final projectId = Firebase.app().options.projectId;
    return 'https://us-central1-$projectId.cloudfunctions.net';
  }

  // Get user's email reminder preferences
  Future<Map<String, dynamic>> getEmailPreferences() async {
    if (_screenshotMode) {
      return {
        'emailRemindersEnabled': true,
        'email': 'demo@vehicle-vitals.com',
      };
    }

    final user = _auth.currentUser;
    if (user == null) {
      throw Exception('Not authenticated');
    }

    final userDoc = await _firestore.collection('users').doc(_userId).get();
    final userData = userDoc.data() ?? <String, dynamic>{};
    final enabled = (userData['emailRemindersEnabled'] as bool?) ?? true;

    return {'emailRemindersEnabled': enabled, 'email': user.email ?? ''};
  }

  // Update email reminder preferences
  Future<void> updateEmailPreferences(bool enabled) async {
    if (_screenshotMode) return;

    await _firestore.collection('users').doc(_userId).set({
      'emailRemindersEnabled': enabled,
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  // Send a test maintenance reminder
  Future<void> sendTestReminder() async {
    if (_screenshotMode) return;

    final user = _auth.currentUser;
    if (user == null || user.email == null || user.email!.isEmpty) {
      throw Exception('No authenticated email available');
    }

    final vehicles = await _firestore
        .collection('users')
        .doc(_userId)
        .collection('vehicles')
        .limit(1)
        .get();

    if (vehicles.docs.isEmpty) {
      throw Exception('Add a vehicle before sending a test reminder');
    }

    final vehicleData = vehicles.docs.first.data();
    final payload = {
      'email': user.email,
      'vehicle': {
        'vin': vehicles.docs.first.id,
        'make': (vehicleData['make'] ?? 'Vehicle').toString(),
        'model': (vehicleData['model'] ?? '').toString(),
        'year': (vehicleData['year'] ?? '').toString(),
      },
      'maintenanceItems': [
        {
          'title': 'Test Reminder',
          'dueDate': DateTime.now()
              .add(const Duration(days: 7))
              .toIso8601String()
              .split('T')
              .first,
        },
      ],
    };

    final endpoint = '${_resolveFunctionsBaseUrl()}/sendMaintenanceReminder';
    final client = HttpClient();
    try {
      final request = await client.postUrl(Uri.parse(endpoint));
      request.headers.contentType = ContentType.json;
      final idToken = await user.getIdToken();
      if (idToken != null && idToken.isNotEmpty) {
        request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $idToken');
      }
      request.write(jsonEncode(payload));

      final response = await request.close();
      final body = await response.transform(utf8.decoder).join();
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw Exception(
          'Reminder request failed (${response.statusCode}): ${body.isEmpty ? 'No response body' : body}',
        );
      }
    } finally {
      client.close(force: true);
    }
  }
}
