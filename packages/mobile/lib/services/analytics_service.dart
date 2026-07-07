import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

const bool _screenshotMode = bool.fromEnvironment('VV_SCREENSHOT_MODE');

class AnalyticsService extends ChangeNotifier {
  static const String _analyticsEnabledKey = 'analytics_enabled';

  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  bool _isAnalyticsEnabled = true;

  bool get isAnalyticsEnabled => _isAnalyticsEnabled;

  AnalyticsService() {
    _loadAnalyticsPreference();
  }

  String? get _userId => _auth.currentUser?.uid;

  Future<void> _loadAnalyticsPreference() async {
    final prefs = await SharedPreferences.getInstance();
    _isAnalyticsEnabled = prefs.getBool(_analyticsEnabledKey) ?? true;
    notifyListeners();
  }

  Future<void> _saveAnalyticsPreference(bool enabled) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_analyticsEnabledKey, enabled);
    _isAnalyticsEnabled = enabled;
    notifyListeners();
  }

  Future<void> setAnalyticsEnabled(bool enabled) async {
    await _saveAnalyticsPreference(enabled);
    if (_screenshotMode) return;

    final uid = _userId;
    if (uid != null) {
      await _firestore.collection('users').doc(uid).set({
        'analyticsEnabled': enabled,
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));
    }
  }

  // Track user actions (only if analytics is enabled)
  Future<void> trackEvent(
    String eventName,
    Map<String, dynamic> parameters,
  ) async {
    if (_screenshotMode) return;
    if (!_isAnalyticsEnabled) return;

    final uid = _userId;
    if (uid == null) return;

    await _firestore
        .collection('users')
        .doc(uid)
        .collection('analyticsEvents')
        .add({
          'eventName': eventName,
          'parameters': parameters,
          'createdAt': FieldValue.serverTimestamp(),
        });
  }

  // Track screen views
  Future<void> trackScreenView(String screenName) async {
    await trackEvent('screen_view', {'screenName': screenName});
  }

  // Track maintenance actions
  Future<void> trackMaintenanceAction(String action, String vin) async {
    await trackEvent('maintenance_action', {'action': action, 'vin': vin});
  }

  // Track vehicle actions
  Future<void> trackVehicleAction(String action, String vin) async {
    await trackEvent('vehicle_action', {'action': action, 'vin': vin});
  }

  // Get analytics insights
  Future<Map<String, dynamic>> getAnalyticsInsights() async {
    if (_screenshotMode) {
      return {
        'totalEvents': 128,
        'screenViews': 74,
        'maintenanceActions': 21,
        'vehicleActions': 18,
        'mostVisitedScreen': 'Garage',
        'period': 'last_30_days',
      };
    }

    final uid = _userId;
    if (uid == null) {
      return {
        'totalEvents': 0,
        'screenViews': 0,
        'maintenanceActions': 0,
        'vehicleActions': 0,
        'mostVisitedScreen': null,
        'period': 'last_30_days',
      };
    }

    final snapshot = await _firestore
        .collection('users')
        .doc(uid)
        .collection('analyticsEvents')
        .get();

    final cutoff = DateTime.now().subtract(const Duration(days: 30));
    final events = snapshot.docs.map((d) => d.data()).where((e) {
      final ts = e['createdAt'];
      if (ts is! Timestamp) return false;
      return ts.toDate().isAfter(cutoff);
    }).toList();

    final screenViews = events
        .where((e) => e['eventName'] == 'screen_view')
        .toList();
    final maintenanceActions = events
        .where((e) => e['eventName'] == 'maintenance_action')
        .length;
    final vehicleActions = events
        .where((e) => e['eventName'] == 'vehicle_action')
        .length;

    final screenCounts = <String, int>{};
    for (final event in screenViews) {
      final params = event['parameters'];
      final screen =
          (params is Map ? params['screenName'] : null)?.toString() ??
          'unknown';
      screenCounts[screen] = (screenCounts[screen] ?? 0) + 1;
    }

    String? mostVisitedScreen;
    int maxCount = 0;
    screenCounts.forEach((screen, eventCount) {
      if (eventCount > maxCount) {
        maxCount = eventCount;
        mostVisitedScreen = screen;
      }
    });

    return {
      'totalEvents': events.length,
      'screenViews': screenViews.length,
      'maintenanceActions': maintenanceActions,
      'vehicleActions': vehicleActions,
      'mostVisitedScreen': mostVisitedScreen,
      'period': 'last_30_days',
    };
  }

  // Get maintenance insights
  Future<Map<String, dynamic>> getMaintenanceInsights() async {
    if (_screenshotMode) {
      return {
        'totalVehicles': 3,
        'totalMaintenanceEntries': 9,
        'totalMaintenanceCost': 843.47,
        'averageCostPerEntry': 93.72,
        'mostCommonMaintenance': 'Oil and filter service',
        'recentMaintenance': [
          {
            'title': 'Oil and filter service',
            'cost': 86.42,
            'date': DateTime.now().subtract(const Duration(days: 28)),
            'vin': '1FTEW1EP8NFA23457',
          },
          {
            'title': 'Tire rotation and pressure check',
            'cost': 29.99,
            'date': DateTime.now().subtract(const Duration(days: 84)),
            'vin': '5YJ3E1EA7PF123456',
          },
          {
            'title': 'Brake inspection',
            'cost': 164.75,
            'date': DateTime.now().subtract(const Duration(days: 132)),
            'vin': '2HGFE2F53PH654321',
          },
        ],
      };
    }

    final uid = _userId;
    if (uid == null) {
      return {
        'totalVehicles': 0,
        'totalMaintenanceEntries': 0,
        'totalMaintenanceCost': 0.0,
        'averageCostPerEntry': 0.0,
        'mostCommonMaintenance': null,
        'recentMaintenance': <Map<String, dynamic>>[],
      };
    }

    final vehiclesSnapshot = await _firestore
        .collection('users')
        .doc(uid)
        .collection('vehicles')
        .get();

    final recentMaintenance = <Map<String, dynamic>>[];
    final maintenanceTypeCounts = <String, int>{};
    double totalMaintenanceCost = 0;
    int totalMaintenanceEntries = 0;

    for (final vehicleDoc in vehiclesSnapshot.docs) {
      final vin = vehicleDoc.id;
      final maintenanceSnapshot = await _firestore
          .collection('users')
          .doc(uid)
          .collection('vehicles')
          .doc(vin)
          .collection('maintenance')
          .orderBy('date', descending: true)
          .limit(20)
          .get();

      for (final doc in maintenanceSnapshot.docs) {
        final entry = doc.data();
        final title = (entry['title'] ?? 'Unknown').toString();
        final cost = ((entry['cost'] ?? 0) as num).toDouble();
        final date = (entry['date'] is Timestamp)
            ? (entry['date'] as Timestamp).toDate()
            : DateTime.now();

        totalMaintenanceEntries += 1;
        totalMaintenanceCost += cost;
        maintenanceTypeCounts[title] = (maintenanceTypeCounts[title] ?? 0) + 1;

        recentMaintenance.add({
          'title': title,
          'cost': cost,
          'date': date,
          'vin': vin,
        });
      }
    }

    recentMaintenance.sort((a, b) {
      final aDate = (a['date'] as DateTime);
      final bDate = (b['date'] as DateTime);
      return bDate.compareTo(aDate);
    });

    String? mostCommonMaintenance;
    int maxTypeCount = 0;
    maintenanceTypeCounts.forEach((title, occurrenceCount) {
      if (occurrenceCount > maxTypeCount) {
        maxTypeCount = occurrenceCount;
        mostCommonMaintenance = title;
      }
    });

    final averageCostPerEntry = totalMaintenanceEntries > 0
        ? totalMaintenanceCost / totalMaintenanceEntries
        : 0.0;

    return {
      'totalVehicles': vehiclesSnapshot.docs.length,
      'totalMaintenanceEntries': totalMaintenanceEntries,
      'totalMaintenanceCost': totalMaintenanceCost,
      'averageCostPerEntry': averageCostPerEntry,
      'mostCommonMaintenance': mostCommonMaintenance,
      'recentMaintenance': recentMaintenance.take(5).toList(),
    };
  }
}
