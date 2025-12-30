// import 'package:cloud_firestore/cloud_firestore.dart';
// import 'package:device_calendar/device_calendar.dart';
// import 'package:firebase_auth/firebase_auth.dart';
import 'package:logging/logging.dart';

class CalendarService {
  // final DeviceCalendarPlugin _deviceCalendar = DeviceCalendarPlugin();
  // final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final Logger _logger = Logger('CalendarService');

  // Check if calendar permissions are granted
  Future<bool> hasCalendarPermissions() async {
    // Mock: always return false for TestFlight
    return false;
  }

  // Request calendar permissions
  Future<bool> requestCalendarPermissions() async {
    // Mock: always return false for TestFlight
    return false;
  }

  // Get available calendars
  Future<List<dynamic>> getAvailableCalendars() async {
    // Mock: return empty list for TestFlight
    return [];
  }

  // Add maintenance reminder to calendar
  Future<bool> addMaintenanceToCalendar({
    required String title,
    required String description,
    required DateTime dueDate,
    required String vehicleInfo,
  }) async {
    // Calendar integration intentionally disabled for TestFlight build
    // to avoid SPM plugin archiving issues. Will be re-implemented post-TestFlight.
    _logger.info('Calendar integration disabled for TestFlight build');
    return false;
  }

  // Get user's calendar preferences
  Future<Map<String, dynamic>> getCalendarPreferences() async {
    // Mock data for TestFlight
    return {'calendarSyncEnabled': false, 'calendarId': null};
  }

  // Update calendar preferences
  Future<void> updateCalendarPreferences(
    bool enabled, {
    String? calendarId,
  }) async {
    // Mock: do nothing for TestFlight
    _logger.info('Mock update calendar preferences - TestFlight build');
  }

  // Sync upcoming maintenance to calendar
  Future<int> syncUpcomingMaintenanceToCalendar() async {
    // Mock: return 0 for TestFlight
    _logger.info('Mock sync upcoming maintenance - TestFlight build');
    return 0;
  }
}
