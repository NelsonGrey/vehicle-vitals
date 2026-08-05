import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

const bool _screenshotMode = bool.fromEnvironment('VV_SCREENSHOT_MODE');

Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('Handling background message: ${message.messageId}');
}

class NotificationService extends ChangeNotifier {
  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  String? _fcmToken;
  bool _isInitialized = false;
  String? _uid;

  String? get fcmToken => _fcmToken;
  bool get isInitialized => _isInitialized;

  Future<void> initialize() async {
    if (_isInitialized) return;

    if (_screenshotMode) {
      _isInitialized = true;
      notifyListeners();
      return;
    }

    try {
      await _firebaseMessaging.requestPermission();

      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
      FirebaseMessaging.instance.onTokenRefresh.listen((token) {
        _fcmToken = token;
        notifyListeners();
        unawaited(_persistToken());
      });

      if (!kIsWeb && defaultTargetPlatform == TargetPlatform.iOS) {
        final apnsToken = await _firebaseMessaging.getAPNSToken();
        if (apnsToken == null) {
          debugPrint(
            'APNS token not available yet; deferring FCM token fetch until refresh.',
          );
        } else {
          _fcmToken = await _firebaseMessaging.getToken();
        }
      } else {
        _fcmToken = await _firebaseMessaging.getToken();
      }

      _isInitialized = true;
      notifyListeners();
      await _persistToken();
    } catch (e) {
      debugPrint('Error initializing notifications: $e');
    }
  }

  // Server-side push (sendPushNotification in functions) reads
  // users/{uid}.fcmToken -- initialize() (token fetch) and sign-in
  // (uid availability) happen independently with no guaranteed order, so
  // this must be called whenever either one changes, mirroring how
  // PremiumService/OnboardingService sync off AuthService.
  Future<void> syncForAuthUser(String? uid) async {
    _uid = uid;
    await _persistToken();
  }

  Future<void> _persistToken() async {
    if (_screenshotMode) return;
    final uid = _uid;
    final token = _fcmToken;
    if (uid == null || uid.isEmpty || token == null || token.isEmpty) {
      return;
    }
    try {
      await _firestore.collection('users').doc(uid).set({
        'fcmToken': token,
      }, SetOptions(merge: true));
    } catch (e) {
      debugPrint('Failed to persist FCM token: $e');
    }
  }

  Future<void> subscribeToTopic(String topic) async {
    await _firebaseMessaging.subscribeToTopic(topic);
  }

  Future<void> unsubscribeFromTopic(String topic) async {
    await _firebaseMessaging.unsubscribeFromTopic(topic);
  }
}
