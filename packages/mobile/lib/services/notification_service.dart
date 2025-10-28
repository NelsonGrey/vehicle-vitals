import 'package:flutter/foundation.dart';
// import 'package:firebase_messaging/firebase_messaging.dart';

class NotificationService extends ChangeNotifier {
  // final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  String? _fcmToken;
  bool _isInitialized = false;

  String? get fcmToken => _fcmToken;
  bool get isInitialized => _isInitialized;

  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      // Mock notification initialization for TestFlight
      debugPrint('Mock notification initialization - TestFlight build');

      // Mock FCM token
      _fcmToken = 'mock-fcm-token-testflight';

      _isInitialized = true;
      notifyListeners();
    } catch (e) {
      debugPrint('Error initializing mock notifications: $e');
    }
  }

  Future<void> subscribeToTopic(String topic) async {
    // Mock subscription
    debugPrint('Mock subscribed to topic: $topic');
  }

  Future<void> unsubscribeFromTopic(String topic) async {
    // Mock unsubscription
    debugPrint('Mock unsubscribed from topic: $topic');
  }
}

// Background message handler - disabled for TestFlight
// Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
//   debugPrint('Handling a background message: ${message.messageId}');
//   debugPrint('Message data: ${message.data}');

//   if (message.notification != null) {
//     debugPrint(
//       'Message also contained a notification: ${message.notification}',
//     );
//   }
// }
