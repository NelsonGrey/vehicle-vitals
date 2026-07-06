import 'dart:async';

import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
import 'package:flutter/foundation.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart' as apple;

const bool _screenshotMode = bool.fromEnvironment('VV_SCREENSHOT_MODE');
const String _screenshotEmail = String.fromEnvironment('VV_SCREENSHOT_EMAIL');
const String _screenshotPassword = String.fromEnvironment(
  'VV_SCREENSHOT_PASSWORD',
);

// App-level user model used by screens.
class User {
  final String uid;
  final String? email;
  final String? displayName;
  final bool emailVerified;
  final List<String> providerIds;

  User({
    required this.uid,
    this.email,
    this.displayName,
    this.emailVerified = true,
    this.providerIds = const [],
  });
}

// App-level auth response wrapper used by screens.
class UserCredential {
  final User user;

  UserCredential({required this.user});
}

class AuthService extends ChangeNotifier {
  final firebase_auth.FirebaseAuth _auth = firebase_auth.FirebaseAuth.instance;
  StreamSubscription<firebase_auth.User?>? _authSubscription;
  firebase_auth.AuthCredential? _pendingLinkCredential;
  String? _pendingLinkEmail;
  User? _currentUser;
  bool _isLoading = true;

  AuthService() {
    _init();
  }

  User? get currentUser => _currentUser;
  bool get isLoading => _isLoading;

  void _init() {
    _currentUser = _mapUser(_auth.currentUser);
    _authSubscription = _auth.authStateChanges().listen((firebaseUser) {
      _currentUser = _mapUser(firebaseUser);
      _isLoading = false;
      notifyListeners();
    });

    if (_screenshotMode && _currentUser == null) {
      _signInForScreenshots();
    }
  }

  Future<void> _signInForScreenshots() async {
    if (_screenshotEmail.isEmpty || _screenshotPassword.isEmpty) {
      debugPrint(
        'Screenshot mode enabled but demo credentials were not provided.',
      );
      return;
    }

    try {
      await signInWithEmailAndPassword(_screenshotEmail, _screenshotPassword);
    } catch (e) {
      debugPrint('Screenshot auto sign-in failed: $e');
    }
  }

  User? _mapUser(firebase_auth.User? user) {
    if (user == null) return null;
    return User(
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
      providerIds: user.providerData
          .map((provider) => provider.providerId)
          .whereType<String>()
          .toList(),
    );
  }

  String _buildProviderConflictMessage(String? email) {
    if (email == null || email.trim().isEmpty) {
      return 'This credential is already tied to another account. Sign in with your existing method; Apple will be linked automatically after sign-in.';
    }

    return 'This email already belongs to an existing account. Sign in with that existing method first; Apple will be linked automatically.';
  }

  void _setPendingProviderLink({
    required firebase_auth.AuthCredential credential,
    String? email,
  }) {
    _pendingLinkCredential = credential;
    _pendingLinkEmail = email?.trim().toLowerCase();
  }

  Future<void> _linkPendingProviderIfNeeded(firebase_auth.User? user) async {
    final pendingCredential = _pendingLinkCredential;
    if (pendingCredential == null || user == null) {
      return;
    }

    final userEmail = (user.email ?? '').trim().toLowerCase();
    final pendingEmail = (_pendingLinkEmail ?? '').trim().toLowerCase();

    if (pendingEmail.isNotEmpty &&
        userEmail.isNotEmpty &&
        pendingEmail != userEmail) {
      return;
    }

    try {
      await user.linkWithCredential(pendingCredential);
      await user.reload();
    } on firebase_auth.FirebaseAuthException catch (e) {
      if (e.code != 'provider-already-linked' &&
          e.code != 'credential-already-in-use' &&
          e.code != 'requires-recent-login') {
        rethrow;
      }
    } finally {
      _pendingLinkCredential = null;
      _pendingLinkEmail = null;
    }
  }

  Future<UserCredential?> signInWithEmailAndPassword(
    String email,
    String password,
  ) async {
    try {
      final credential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      await _linkPendingProviderIfNeeded(credential.user);
      final user = _mapUser(_auth.currentUser ?? credential.user);
      _currentUser = user;
      notifyListeners();
      if (user == null) return null;
      return UserCredential(user: user);
    } on firebase_auth.FirebaseAuthException catch (e) {
      throw Exception(_friendlyAuthMessage(e, email.trim()));
    }
  }

  String _friendlyAuthMessage(
    firebase_auth.FirebaseAuthException e,
    String email,
  ) {
    switch (e.code) {
      case 'invalid-credential':
      case 'wrong-password':
      case 'invalid-email':
        if (email.isNotEmpty) {
          return 'Invalid email or password. If this email is used with Google or Apple on web, use that provider instead.';
        }
        return 'Invalid email or password.';
      case 'user-not-found':
        return 'No account found for this email. Please sign up first.';
      case 'user-disabled':
        return 'This account has been disabled.';
      case 'network-request-failed':
        return 'Network error. Please check your connection and try again.';
      case 'too-many-requests':
        return 'Too many attempts. Please wait and try again.';
      case 'operation-not-allowed':
        return 'Email/password sign-in is not enabled for this project.';
      default:
        return e.message ?? 'Authentication failed. Please try again.';
    }
  }

  Future<UserCredential?> createUserWithEmailAndPassword(
    String email,
    String password,
  ) async {
    try {
      final credential = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
      final user = _mapUser(credential.user);
      _currentUser = user;
      notifyListeners();
      if (user == null) return null;
      return UserCredential(user: user);
    } on firebase_auth.FirebaseAuthException catch (e) {
      if (e.code == 'email-already-in-use') {
        throw Exception(
          'An account already exists for this email. Sign in instead of creating another account.',
        );
      }
      throw Exception(e.message ?? 'Authentication failed. Please try again.');
    }
  }

  Future<void> signOut() async {
    await _auth.signOut();
    _pendingLinkCredential = null;
    _pendingLinkEmail = null;
    _currentUser = null;
    notifyListeners();
  }

  Future<void> resetPassword(String email) async {
    await _auth.sendPasswordResetEmail(email: email);
  }

  Future<UserCredential?> signInWithApple() async {
    final appleCredential = await apple.SignInWithApple.getAppleIDCredential(
      scopes: [
        apple.AppleIDAuthorizationScopes.email,
        apple.AppleIDAuthorizationScopes.fullName,
      ],
    );

    final oauthCredential = firebase_auth.OAuthProvider('apple.com').credential(
      idToken: appleCredential.identityToken,
      accessToken: appleCredential.authorizationCode,
    );

    try {
      final credential = await _auth.signInWithCredential(oauthCredential);
      final user = _mapUser(credential.user);
      _currentUser = user;
      notifyListeners();
      if (user == null) return null;
      return UserCredential(user: user);
    } on firebase_auth.FirebaseAuthException catch (e) {
      if (e.code == 'account-exists-with-different-credential' ||
          e.code == 'credential-already-in-use') {
        _setPendingProviderLink(
          credential: oauthCredential,
          email: e.email ?? appleCredential.email,
        );
        final message = _buildProviderConflictMessage(
          e.email ?? appleCredential.email,
        );
        throw Exception(message);
      }
      throw Exception(e.message ?? 'Apple sign-in failed. Please try again.');
    }
  }

  Future<void> linkCurrentUserWithApple() async {
    final currentUser = _auth.currentUser;
    if (currentUser == null) {
      throw Exception('Sign in first before linking Apple.');
    }

    final appleCredential = await apple.SignInWithApple.getAppleIDCredential(
      scopes: [
        apple.AppleIDAuthorizationScopes.email,
        apple.AppleIDAuthorizationScopes.fullName,
      ],
    );

    final oauthCredential = firebase_auth.OAuthProvider('apple.com').credential(
      idToken: appleCredential.identityToken,
      accessToken: appleCredential.authorizationCode,
    );

    try {
      await currentUser.linkWithCredential(oauthCredential);
      await currentUser.reload();
      _currentUser = _mapUser(_auth.currentUser);
      notifyListeners();
    } on firebase_auth.FirebaseAuthException catch (e) {
      if (e.code == 'provider-already-linked') {
        return;
      }
      if (e.code == 'credential-already-in-use') {
        throw Exception(
          'That Apple identity is already linked to another account. Sign in with that account first if you need to consolidate data.',
        );
      }
      throw Exception(e.message ?? 'Unable to link Apple sign-in.');
    }
  }

  Future<Map<String, dynamic>> consolidateAccountData({
    required String sourceUid,
    String? idempotencyKey,
  }) async {
    final currentUser = _auth.currentUser;
    if (currentUser == null) {
      throw Exception('Sign in first before consolidating accounts.');
    }

    try {
      final functions = FirebaseFunctions.instance;
      final callable = functions.httpsCallable('consolidateAccountDataCallable');
      
      final result = await callable({
        'sourceUid': sourceUid,
        'idempotencyKey': idempotencyKey,
      });

      return result.data as Map<String, dynamic>;
    } on FirebaseFunctionsException catch (e) {
      debugPrint('Firebase Functions error: ${e.code} - ${e.message}');
      throw Exception(
        'Failed to consolidate accounts: ${e.message ?? "Unknown error"}',
      );
    } catch (e) {
      debugPrint('Account consolidation error: $e');
      throw Exception(
        'Failed to consolidate accounts: ${e.toString()}',
      );
    }
  }

  Future<Map<String, dynamic>> requestAccountDataDeletion() async {
    if (_auth.currentUser == null) {
      throw Exception('Sign in first before requesting account deletion.');
    }

    try {
      final callable = FirebaseFunctions.instance.httpsCallable(
        'requestUserDataDeletionCallable',
      );
      final result = await callable({});
      return result.data as Map<String, dynamic>;
    } on FirebaseFunctionsException catch (e) {
      throw Exception(
        'Failed to file deletion request: ${e.message ?? "Unknown error"}',
      );
    }
  }

  Future<Map<String, dynamic>> requestAccountDataExport() async {
    if (_auth.currentUser == null) {
      throw Exception('Sign in first before requesting a data export.');
    }

    try {
      final callable = FirebaseFunctions.instance.httpsCallable(
        'requestUserDataExportCallable',
      );
      final result = await callable({});
      return result.data as Map<String, dynamic>;
    } on FirebaseFunctionsException catch (e) {
      throw Exception(
        'Failed to file data export request: ${e.message ?? "Unknown error"}',
      );
    }
  }

  @override
  void dispose() {
    _authSubscription?.cancel();
    super.dispose();
  }
}
