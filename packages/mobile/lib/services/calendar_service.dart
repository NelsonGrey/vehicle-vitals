import 'dart:convert';
import 'dart:io';

import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:logging/logging.dart';
import 'package:shared_preferences/shared_preferences.dart';

class CalendarService {
  final FirebaseFunctions _functions = FirebaseFunctions.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final Logger _logger = Logger('CalendarService');
  static const String _syncEnabledKey = 'calendar_sync_enabled';
  static const String _targetKey = 'calendar_target';
  static const String _functionsBaseUrl = String.fromEnvironment(
    'FUNCTIONS_BASE_URL',
    defaultValue: '',
  );

  Uri _resolveCalendarEventUri() {
    final explicit = _functionsBaseUrl.trim();
    if (explicit.isNotEmpty) {
      return Uri.parse(
        '${explicit.replaceAll(RegExp(r'/+$'), '')}/createCalendarEvent',
      );
    }

    // Fallback default for current Firebase project/region conventions.
    return Uri.parse(
      'https://us-central1-vehicle-vitals.cloudfunctions.net/createCalendarEvent',
    );
  }

  Future<Map<String, dynamic>> _callCalendarEventHttp(
    Map<String, dynamic> payload,
  ) async {
    final client = HttpClient();
    try {
      final request = await client.postUrl(_resolveCalendarEventUri());
      request.headers.contentType = ContentType.json;
      final idToken = await _auth.currentUser?.getIdToken();
      if (idToken != null && idToken.isNotEmpty) {
        request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $idToken');
      }
      request.write(jsonEncode(payload));

      final response = await request.close();
      final responseBody = await response.transform(utf8.decoder).join();
      final parsed =
          (responseBody.isNotEmpty
                  ? jsonDecode(responseBody)
                  : <String, dynamic>{})
              as Map;
      final data = Map<String, dynamic>.from(parsed);

      if (response.statusCode < 200 || response.statusCode >= 300) {
        final message = (data['error'] ?? 'Calendar HTTP request failed')
            .toString();
        throw Exception(message);
      }

      if (data['success'] != true) {
        final message = (data['error'] ?? 'Calendar sync failed').toString();
        throw Exception(message);
      }

      return Map<String, dynamic>.from(data['event'] as Map? ?? {});
    } finally {
      client.close(force: true);
    }
  }

  // Check if calendar permissions are granted
  Future<bool> hasCalendarPermissions() async {
    // Endpoint-backed flow does not require device-calendar permissions.
    return true;
  }

  // Request calendar permissions
  Future<bool> requestCalendarPermissions() async {
    // Endpoint-backed flow does not require device-calendar permissions.
    return true;
  }

  // Get available calendars
  Future<List<dynamic>> getAvailableCalendars() async {
    return [
      {'id': 'google', 'name': 'Google Calendar'},
      {'id': 'apple', 'name': 'Apple Calendar (ICS import)'},
      {'id': 'ics', 'name': 'ICS Download'},
    ];
  }

  // Add maintenance reminder to calendar through backend endpoint.
  Future<Map<String, dynamic>> addMaintenanceToCalendar({
    required String vehicleVin,
    required String title,
    required String description,
    required DateTime dueDate,
    required String vehicleInfo,
    String? target,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    final selectedTarget = target ?? prefs.getString(_targetKey) ?? 'google';

    final payload = {
      'vehicleVin': vehicleVin,
      'title': title,
      'description': '$description\n$vehicleInfo',
      'startAt': dueDate.toUtc().toIso8601String(),
      'endAt': dueDate.toUtc().add(const Duration(hours: 1)).toIso8601String(),
      'target': selectedTarget,
    };

    Map<String, dynamic> event;
    try {
      final callable = _functions.httpsCallable('createCalendarEventCallable');
      final response = await callable.call(payload);
      final data = Map<String, dynamic>.from(response.data as Map);
      if (data['success'] != true) {
        final message = (data['error'] ?? 'Callable calendar sync failed')
            .toString();
        throw Exception(message);
      }
      event = Map<String, dynamic>.from(data['event'] as Map? ?? {});
    } catch (callableError) {
      _logger.warning(
        'Callable calendar sync failed, falling back to HTTP: $callableError',
      );
      event = await _callCalendarEventHttp(payload);
    }

    _logger.info('Calendar event created', {
      'target': selectedTarget,
      'vehicleVinPrefix': vehicleVin.substring(0, 8),
    });
    return event;
  }

  // Get user's calendar preferences
  Future<Map<String, dynamic>> getCalendarPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    return {
      'calendarSyncEnabled': prefs.getBool(_syncEnabledKey) ?? false,
      'calendarId': prefs.getString(_targetKey) ?? 'google',
    };
  }

  // Update calendar preferences
  Future<void> updateCalendarPreferences(
    bool enabled, {
    String? calendarId,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_syncEnabledKey, enabled);
    await prefs.setString(_targetKey, calendarId ?? 'google');
  }

  // Sync upcoming maintenance to calendar
  Future<int> syncUpcomingMaintenanceToCalendar() async {
    // Batch sync is screen-managed for now; this exists for compatibility.
    _logger.info('Batch calendar sync is initiated by Upcoming Tasks screen');
    return 0;
  }
}
