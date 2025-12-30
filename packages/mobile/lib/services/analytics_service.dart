import 'package:flutter/material.dart';
// import 'package:cloud_firestore/cloud_firestore.dart';
// import 'package:firebase_auth/firebase_auth.dart';
// import 'package:shared_preferences/shared_preferences.dart';

class AnalyticsService extends ChangeNotifier {
  // static const String _analyticsEnabledKey = 'analytics_enabled';
  bool _isAnalyticsEnabled = false; // Disabled for TestFlight

  bool get isAnalyticsEnabled => _isAnalyticsEnabled;

  AnalyticsService() {
    // _loadAnalyticsPreference(); // DISABLED FOR TESTFLIGHT
  }

  // Future<void> _loadAnalyticsPreference() async {
  //   final prefs = await SharedPreferences.getInstance();
  //   _isAnalyticsEnabled = prefs.getBool(_analyticsEnabledKey) ?? true;
  //   notifyListeners();
  // }

  // Future<void> _saveAnalyticsPreference(bool enabled) async {
  //   final prefs = await SharedPreferences.getInstance();
  //   await prefs.setBool(_analyticsEnabledKey, enabled);
  //   _isAnalyticsEnabled = enabled;
  //   notifyListeners();
  // }

  Future<void> setAnalyticsEnabled(bool enabled) async {
    // Mock: do nothing for TestFlight
    _isAnalyticsEnabled = enabled;
    notifyListeners();
  }

  // Track user actions (only if analytics is enabled)
  Future<void> trackEvent(
    String eventName,
    Map<String, dynamic> parameters,
  ) async {
    // Mock: do nothing for TestFlight
    debugPrint('Mock track event: $eventName - TestFlight build');
  }

  // Track screen views
  Future<void> trackScreenView(String screenName) async {
    // Mock: do nothing for TestFlight
    debugPrint('Mock track screen view: $screenName - TestFlight build');
  }

  // Track maintenance actions
  Future<void> trackMaintenanceAction(String action, String vin) async {
    // Mock: do nothing for TestFlight
    debugPrint(
      'Mock track maintenance action: $action for $vin - TestFlight build',
    );
  }

  // Track vehicle actions
  Future<void> trackVehicleAction(String action, String vin) async {
    // Mock: do nothing for TestFlight
    debugPrint(
      'Mock track vehicle action: $action for $vin - TestFlight build',
    );
  }

  // Get analytics insights
  Future<Map<String, dynamic>> getAnalyticsInsights() async {
    // Mock data for TestFlight
    return {
      'totalEvents': 0,
      'screenViews': 0,
      'maintenanceActions': 0,
      'vehicleActions': 0,
      'mostVisitedScreen': null,
      'period': 'testflight_mock',
    };
  }

  // Get maintenance insights
  Future<Map<String, dynamic>> getMaintenanceInsights() async {
    // Mock data for TestFlight
    return {
      'totalVehicles': 2, // From mock data
      'totalMaintenanceEntries': 3, // From mock data
      'totalMaintenanceCost': 227.5, // From mock data
      'averageCostPerEntry': 75.83,
      'mostCommonMaintenance': 'Oil Change',
      'recentMaintenance': [
        {
          'title': 'Oil Change',
          'cost': 85.5,
          'date': DateTime(2024, 6, 1),
          'vin': '1HGCM82633A123456',
        },
        {
          'title': 'Tire Rotation',
          'cost': 25.0,
          'date': DateTime(2024, 4, 15),
          'vin': '1HGCM82633A123456',
        },
        {
          'title': 'Brake Inspection',
          'cost': 120.0,
          'date': DateTime(2024, 3, 10),
          'vin': '2T1BURHE0FC123456',
        },
      ],
    };
  }
}
