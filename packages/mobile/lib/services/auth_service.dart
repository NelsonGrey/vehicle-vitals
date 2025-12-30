import 'package:flutter/foundation.dart';
// import 'package:firebase_auth/firebase_auth.dart';
// import 'package:sign_in_with_apple/sign_in_with_apple.dart' as apple;

// Mock User class for TestFlight build
class User {
  final String uid;
  final String? email;
  final String? displayName;
  final bool emailVerified;

  User({
    required this.uid,
    this.email,
    this.displayName,
    this.emailVerified = true,
  });
}

// Mock UserCredential class for TestFlight build
class UserCredential {
  final User user;

  UserCredential({required this.user});
}

class AuthService extends ChangeNotifier {
  // final FirebaseAuth _auth = FirebaseAuth.instance;
  User? _currentUser;
  bool _isLoading = true;

  AuthService() {
    _init();
  }

  User? get currentUser => _currentUser;
  bool get isLoading => _isLoading;

  void _init() {
    // Mock auth state - always signed in for TestFlight
    _currentUser = User(
      uid: 'testflight-user',
      email: 'test@example.com',
      displayName: 'TestFlight User',
    );
    _isLoading = false;
    notifyListeners();
  }

  Future<UserCredential?> signInWithEmailAndPassword(
    String email,
    String password,
  ) async {
    // Mock successful sign in
    final user = User(uid: 'testflight-user', email: email);
    _currentUser = user;
    notifyListeners();
    return UserCredential(user: user);
  }

  Future<UserCredential?> createUserWithEmailAndPassword(
    String email,
    String password,
  ) async {
    // Mock successful sign up
    final user = User(uid: 'testflight-user', email: email);
    _currentUser = user;
    notifyListeners();
    return UserCredential(user: user);
  }

  Future<void> signOut() async {
    // Mock sign out
    _currentUser = null;
    notifyListeners();
  }

  Future<void> resetPassword(String email) async {
    // Mock password reset - do nothing
    debugPrint('Mock password reset for: $email');
  }

  Future<UserCredential?> signInWithApple() async {
    // Mock Apple sign in
    final user = User(
      uid: 'testflight-apple-user',
      email: 'apple@example.com',
      displayName: 'Apple User',
    );
    _currentUser = user;
    notifyListeners();
    return UserCredential(user: user);
  }
}
