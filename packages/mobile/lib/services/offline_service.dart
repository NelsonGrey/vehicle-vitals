import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
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
      // Enable offline persistence for Firestore
      FirebaseFirestore.instance.settings = const Settings(
        persistenceEnabled: true,
        cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
      );

      // Listen to connectivity changes (simplified - in production use connectivity_plus)
      FirebaseFirestore.instance.snapshotsInSync().listen((_) {
        // This fires when local cache is in sync
        _updateOnlineStatus(true);
      });

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

    if (enabled) {
      // Re-enable offline persistence
      FirebaseFirestore.instance.settings = const Settings(
        persistenceEnabled: true,
        cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
      );
    } else {
      // Disable offline persistence
      FirebaseFirestore.instance.settings = const Settings(
        persistenceEnabled: false,
      );
    }
  }

  void _updateOnlineStatus(bool online) {
    if (_isOnline != online) {
      _isOnline = online;
      notifyListeners();
    }
  }

  // Get offline queue status
  Future<Map<String, dynamic>> getOfflineStatus() async {
    return {
      'isOnline': _isOnline,
      'offlineEnabled': _isOfflineEnabled,
      'hasPendingWrites': false, // Simplified for now
    };
  }

  // Force sync when coming back online
  Future<void> syncPendingChanges() async {
    try {
      await FirebaseFirestore.instance.waitForPendingWrites();
      debugPrint('Pending changes synced successfully');
    } catch (e) {
      debugPrint('Failed to sync pending changes: $e');
    }
  }

  // Clear local cache (useful for troubleshooting)
  Future<void> clearCache() async {
    try {
      await FirebaseFirestore.instance.clearPersistence();
      await FirebaseFirestore.instance.disableNetwork();
      await Future.delayed(const Duration(milliseconds: 100));
      await FirebaseFirestore.instance.enableNetwork();
      debugPrint('Local cache cleared');
    } catch (e) {
      debugPrint('Failed to clear cache: $e');
    }
  }
}
