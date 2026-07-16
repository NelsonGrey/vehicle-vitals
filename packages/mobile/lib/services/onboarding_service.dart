import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

const bool _screenshotMode = bool.fromEnvironment('VV_SCREENSHOT_MODE');

class OnboardingService extends ChangeNotifier {
  String? _activeUid;
  bool _isLoading = true;
  bool _isCompleted = false;

  bool get isLoading => _isLoading;
  bool get isCompleted => _isCompleted;

  String _completionKey(String uid) => 'onboarding_completed_$uid';

  Future<void> syncForAuthUser(String? uid) async {
    if (uid == _activeUid) {
      return;
    }

    _activeUid = uid;
    _isLoading = true;
    notifyListeners();

    if (uid == null || uid.isEmpty) {
      _isCompleted = false;
      _isLoading = false;
      notifyListeners();
      return;
    }

    if (_screenshotMode) {
      _isCompleted = true;
      _isLoading = false;
      notifyListeners();
      return;
    }

    final prefs = await SharedPreferences.getInstance();
    _isCompleted = prefs.getBool(_completionKey(uid)) ?? false;
    _isLoading = false;
    notifyListeners();
  }

  Future<void> markCompleted() async {
    final uid = _activeUid;
    if (uid == null || uid.isEmpty) {
      return;
    }

    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_completionKey(uid), true);
    _isCompleted = true;
    notifyListeners();
  }

  Future<void> resetForCurrentUser() async {
    final uid = _activeUid;
    if (uid == null || uid.isEmpty) {
      return;
    }

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_completionKey(uid));
    _isCompleted = false;
    notifyListeners();
  }
}
