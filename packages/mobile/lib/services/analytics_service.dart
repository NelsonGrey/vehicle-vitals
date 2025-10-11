import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AnalyticsService extends ChangeNotifier {
  static const String _analyticsEnabledKey = 'analytics_enabled';
  bool _isAnalyticsEnabled = true; // Default to enabled for better insights

  bool get isAnalyticsEnabled => _isAnalyticsEnabled;

  AnalyticsService() {
    _loadAnalyticsPreference();
  }

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
  }

  // Track user actions (only if analytics is enabled)
  Future<void> trackEvent(
    String eventName,
    Map<String, dynamic> parameters,
  ) async {
    if (!_isAnalyticsEnabled) return;

    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) return;

      await FirebaseFirestore.instance
          .collection('analytics')
          .doc(user.uid)
          .collection('events')
          .add({
            'eventName': eventName,
            'parameters': parameters,
            'timestamp': FieldValue.serverTimestamp(),
            'platform': 'mobile', // Could be 'web' for web app
          });
    } catch (e) {
      debugPrint('Failed to track event: $e');
    }
  }

  // Track screen views
  Future<void> trackScreenView(String screenName) async {
    await trackEvent('screen_view', {'screen_name': screenName});
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
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) return {};

      final eventsRef = FirebaseFirestore.instance
          .collection('analytics')
          .doc(user.uid)
          .collection('events');

      // Get events from last 30 days
      final thirtyDaysAgo = DateTime.now().subtract(const Duration(days: 30));
      final eventsQuery = await eventsRef
          .where('timestamp', isGreaterThan: Timestamp.fromDate(thirtyDaysAgo))
          .get();

      final events = eventsQuery.docs;

      // Calculate insights
      final screenViews = events
          .where((e) => e.data()['eventName'] == 'screen_view')
          .length;
      final maintenanceActions = events
          .where((e) => e.data()['eventName'] == 'maintenance_action')
          .length;
      final vehicleActions = events
          .where((e) => e.data()['eventName'] == 'vehicle_action')
          .length;

      // Most visited screens
      final screenCounts = <String, int>{};
      for (final event in events.where(
        (e) => e.data()['eventName'] == 'screen_view',
      )) {
        final screenName = event.data()['parameters']['screen_name'] as String?;
        if (screenName != null) {
          screenCounts[screenName] = (screenCounts[screenName] ?? 0) + 1;
        }
      }

      final mostVisitedScreen = screenCounts.isNotEmpty
          ? screenCounts.entries.reduce((a, b) => a.value > b.value ? a : b).key
          : null;

      return {
        'totalEvents': events.length,
        'screenViews': screenViews,
        'maintenanceActions': maintenanceActions,
        'vehicleActions': vehicleActions,
        'mostVisitedScreen': mostVisitedScreen,
        'period': 'last_30_days',
      };
    } catch (e) {
      debugPrint('Failed to get analytics insights: $e');
      return {};
    }
  }

  // Get maintenance insights
  Future<Map<String, dynamic>> getMaintenanceInsights() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) return {};

      // Get all vehicles
      final vehiclesSnapshot = await FirebaseFirestore.instance
          .collection('users')
          .doc(user.uid)
          .collection('vehicles')
          .get();

      int totalVehicles = vehiclesSnapshot.docs.length;
      int totalMaintenanceEntries = 0;
      double totalMaintenanceCost = 0.0;
      final maintenanceByType = <String, int>{};
      final recentMaintenance = <Map<String, dynamic>>[];

      for (final vehicleDoc in vehiclesSnapshot.docs) {
        final vin = vehicleDoc.id;
        final maintenanceSnapshot = await FirebaseFirestore.instance
            .collection('users')
            .doc(user.uid)
            .collection('vehicles')
            .doc(vin)
            .collection('maintenance')
            .get();

        totalMaintenanceEntries += maintenanceSnapshot.docs.length;

        for (final entryDoc in maintenanceSnapshot.docs) {
          final data = entryDoc.data();
          final cost = (data['cost'] as num?)?.toDouble() ?? 0.0;
          totalMaintenanceCost += cost;

          final title = data['title'] as String? ?? 'Unknown';
          maintenanceByType[title] = (maintenanceByType[title] ?? 0) + 1;

          // Add to recent maintenance (last 10)
          if (recentMaintenance.length < 10) {
            recentMaintenance.add({
              'title': title,
              'cost': cost,
              'date': data['date'],
              'vin': vin,
            });
          }
        }
      }

      // Sort recent maintenance by date
      recentMaintenance.sort((a, b) {
        final dateA = (a['date'] as Timestamp?)?.toDate() ?? DateTime.now();
        final dateB = (b['date'] as Timestamp?)?.toDate() ?? DateTime.now();
        return dateB.compareTo(dateA);
      });

      final mostCommonMaintenance = maintenanceByType.isNotEmpty
          ? maintenanceByType.entries
                .reduce((a, b) => a.value > b.value ? a : b)
                .key
          : null;

      return {
        'totalVehicles': totalVehicles,
        'totalMaintenanceEntries': totalMaintenanceEntries,
        'totalMaintenanceCost': totalMaintenanceCost,
        'averageCostPerEntry': totalMaintenanceEntries > 0
            ? totalMaintenanceCost / totalMaintenanceEntries
            : 0.0,
        'mostCommonMaintenance': mostCommonMaintenance,
        'recentMaintenance': recentMaintenance,
      };
    } catch (e) {
      debugPrint('Failed to get maintenance insights: $e');
      return {};
    }
  }
}
