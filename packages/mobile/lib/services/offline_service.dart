import 'package:flutter/material.dart';
// import 'package:cloud_firestore/cloud_firestore.dart';
// import 'package:shared_preferences/shared_preferences.dart';

class OfflineService extends ChangeNotifier {
  // static const String _offlineEnabledKey = 'offline_enabled';
  bool _isOfflineEnabled = true; // Default to enabled
  final bool _isOnline = true; // Mock: always online for TestFlight

  bool get isOfflineEnabled => _isOfflineEnabled;
  bool get isOnline => _isOnline;

  OfflineService() {
    // _initializeOfflineSupport(); // DISABLED FOR TESTFLIGHT
    // _loadOfflinePreference(); // DISABLED FOR TESTFLIGHT
  }

  // Future<void> _initializeOfflineSupport() async {
  //   try {
  //     // Enable offline persistence for Firestore
  //     FirebaseFirestore.instance.settings = const Settings(
  //       persistenceEnabled: true,
  //       cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
  //     );

  //     // Listen to connectivity changes (simplified - in production use connectivity_plus)
  //     FirebaseFirestore.instance.snapshotsInSync().listen((_) {
  //       // This fires when local cache is in sync
  //       _updateOnlineStatus(true);
  //     });

  //     debugPrint('Offline support initialized');
  //   } catch (e) {
  //     debugPrint('Failed to initialize offline support: $e');
  //   }
  // }

  // Future<void> _loadOfflinePreference() async {
  //   final prefs = await SharedPreferences.getInstance();
  //   _isOfflineEnabled = prefs.getBool(_offlineEnabledKey) ?? true;
  //   notifyListeners();
  // }

  // Future<void> _saveOfflinePreference(bool enabled) async {
  //   final prefs = await SharedPreferences.getInstance();
  //   await prefs.setBool(_offlineEnabledKey, enabled);
  //   _isOfflineEnabled = enabled;
  //   notifyListeners();
  // }

  Future<void> setOfflineEnabled(bool enabled) async {
    // Mock: do nothing for TestFlight
    _isOfflineEnabled = enabled;
    notifyListeners();
  }

  // void _updateOnlineStatus(bool online) {
  //   if (_isOnline != online) {
  //     _isOnline = online;
  //     notifyListeners();
  //   }
  // }

  // Get offline queue status
  Future<Map<String, dynamic>> getOfflineStatus() async {
    return {
      'isOnline': _isOnline,
      'offlineEnabled': _isOfflineEnabled,
      'hasPendingWrites': false, // Always false for TestFlight
    };
  }

  // Force sync when coming back online
  Future<void> syncPendingChanges() async {
    // Mock: do nothing for TestFlight
    debugPrint('Mock sync pending changes - TestFlight build');
  }

  // Clear local cache (useful for troubleshooting)
  Future<void> clearCache() async {
    // Mock: do nothing for TestFlight
    debugPrint('Mock clear cache - TestFlight build');
  }
}
