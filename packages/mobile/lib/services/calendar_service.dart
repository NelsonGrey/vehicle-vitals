import 'package:add_2_calendar/add_2_calendar.dart' as add2cal;
import 'package:device_calendar/device_calendar.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class CalendarService {
  final DeviceCalendarPlugin _deviceCalendar = DeviceCalendarPlugin();
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Check if calendar permissions are granted
  Future<bool> hasCalendarPermissions() async {
    final permissionsGranted = await _deviceCalendar.hasPermissions();
    return permissionsGranted.isSuccess && permissionsGranted.data == true;
  }

  // Request calendar permissions
  Future<bool> requestCalendarPermissions() async {
    final permissionsGranted = await _deviceCalendar.requestPermissions();
    return permissionsGranted.isSuccess && permissionsGranted.data == true;
  }

  // Get available calendars
  Future<List<Calendar>> getAvailableCalendars() async {
    final calendarsResult = await _deviceCalendar.retrieveCalendars();
    if (calendarsResult.isSuccess && calendarsResult.data != null) {
      return calendarsResult.data!
          .where(
            (calendar) =>
                calendar.isReadOnly == false && calendar.isDefault == true,
          )
          .toList();
    }
    return [];
  }

  // Add maintenance reminder to calendar
  Future<bool> addMaintenanceToCalendar({
    required String title,
    required String description,
    required DateTime dueDate,
    required String vehicleInfo,
  }) async {
    try {
      final event = add2cal.Event(
        title: 'Vehicle Maintenance: $title',
        description:
            '$description\n\nVehicle: $vehicleInfo\n\nAdded by Vehicle Vitals',
        startDate: dueDate,
        endDate: dueDate.add(const Duration(hours: 1)), // 1 hour duration
        location: 'Vehicle Service Center',
      );

      final result = await add2cal.Add2Calendar.addEvent2Cal(event);
      return result;
    } catch (e) {
      print('Error adding to calendar: $e');
      return false;
    }
  }

  // Get user's calendar preferences
  Future<Map<String, dynamic>> getCalendarPreferences() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) throw Exception('User not authenticated');

    final doc = await _firestore.collection('users').doc(user.uid).get();
    final data = doc.data() ?? {};

    return {
      'calendarSyncEnabled': data['calendarSyncEnabled'] ?? false,
      'calendarId': data['calendarId'],
    };
  }

  // Update calendar preferences
  Future<void> updateCalendarPreferences(
    bool enabled, {
    String? calendarId,
  }) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) throw Exception('User not authenticated');

    final updateData = <String, dynamic>{'calendarSyncEnabled': enabled};
    if (calendarId != null) {
      updateData['calendarId'] = calendarId;
    }

    await _firestore.collection('users').doc(user.uid).update(updateData);
  }

  // Sync upcoming maintenance to calendar
  Future<int> syncUpcomingMaintenanceToCalendar() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) throw Exception('User not authenticated');

    final preferences = await getCalendarPreferences();
    if (!(preferences['calendarSyncEnabled'] as bool? ?? false)) {
      throw Exception('Calendar sync is disabled');
    }

    // Get all user's vehicles
    final vehiclesSnapshot = await _firestore
        .collection('users')
        .doc(user.uid)
        .collection('vehicles')
        .get();

    int eventsAdded = 0;

    for (final vehicleDoc in vehiclesSnapshot.docs) {
      final vehicle = vehicleDoc.data();
      final vin = vehicleDoc.id;

      // Get maintenance entries due in next 30 days
      final maintenanceSnapshot = await _firestore
          .collection('users')
          .doc(user.uid)
          .collection('vehicles')
          .doc(vin)
          .collection('maintenance')
          .get();

      final now = DateTime.now();
      final thirtyDaysFromNow = now.add(const Duration(days: 30));

      for (final maintenanceDoc in maintenanceSnapshot.docs) {
        final maintenance = maintenanceDoc.data();
        final dueDate = maintenance['date']?.toDate();

        if (dueDate != null &&
            dueDate.isAfter(now) &&
            dueDate.isBefore(thirtyDaysFromNow)) {
          final vehicleInfo =
              '${vehicle['make']} ${vehicle['model']} (${vehicle['year']})';
          final success = await addMaintenanceToCalendar(
            title: maintenance['title'] ?? 'Maintenance',
            description: maintenance['notes'] ?? '',
            dueDate: dueDate,
            vehicleInfo: vehicleInfo,
          );

          if (success) {
            eventsAdded++;
          }
        }
      }
    }

    return eventsAdded;
  }
}
