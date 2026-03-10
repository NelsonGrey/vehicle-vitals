import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class OfflineService extends ChangeNotifier {
  static const String _offlineEnabledKey = 'offline_enabled';
  bool _isOfflineEnabled = true; // Default to enabled
  bool _isOnline = true;

  bool get isOfflineEnabled => _isOfflineEnabled;
  bool get isOnline => _isOnline;

  OfflineService() {
    _initializeOfflineSupport();
    _loadOfflinePreference();
  }

  Future<void> _initializeOfflineSupport() async {
    try {
      FirebaseFirestore.instance.snapshotsInSync().listen(
        (_) {
          _updateOnlineStatus(true);
        },
        onError: (_) {
          _updateOnlineStatus(false);
        },
      );

      debugPrint('Offline support initialized');
    } catch (e) {
      debugPrint('Failed to initialize offline support: $e');
    }
  }

  Future<void> _loadOfflinePreference() async {
    final prefs = await SharedPreferences.getInstance();
    _isOfflineEnabled = prefs.getBool(_offlineEnabledKey) ?? true;
    notifyListeners();
  }

  Future<void> _saveOfflinePreference(bool enabled) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_offlineEnabledKey, enabled);
    _isOfflineEnabled = enabled;
    notifyListeners();
  }

  Future<void> setOfflineEnabled(bool enabled) async {
    await _saveOfflinePreference(enabled);
  }

  void _updateOnlineStatus(bool online) {
    if (_isOnline != online) {
      _isOnline = online;
      notifyListeners();
    }
  }

  // Get offline queue status
  Future<Map<String, dynamic>> getOfflineStatus() async {
    final hasPendingWrites = await FirebaseFirestore.instance
        .waitForPendingWrites()
        .then((_) => false)
        .catchError((_) => true);

    return {
      'isOnline': _isOnline,
      'offlineEnabled': _isOfflineEnabled,
      'hasPendingWrites': hasPendingWrites,
    };
  }

  // Force sync when coming back online
  Future<void> syncPendingChanges() async {
    await FirebaseFirestore.instance.waitForPendingWrites();
    _updateOnlineStatus(true);
  }

  // Clear local cache (useful for troubleshooting)
  Future<void> clearCache() async {
    try {
      await FirebaseFirestore.instance.terminate();
      await FirebaseFirestore.instance.clearPersistence();
    } finally {
      await FirebaseFirestore.instance.enableNetwork();
    }
  }
}
