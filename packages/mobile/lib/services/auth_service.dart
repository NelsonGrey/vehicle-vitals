import 'dart:async';

import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart' as google;
import 'package:sign_in_with_apple/sign_in_with_apple.dart' as apple;

import '../firebase_options.dart';
import '../utils/user_facing_error.dart';

// The OAuth "Web client" ID Firebase auto-generates per project, required as
// `serverClientId` so the ID token google_sign_in returns on Android/iOS has
// an audience Firebase's signInWithCredential will accept. Mirrors the
// per-environment values already baked into the google-services.*.json /
// GoogleService-Info.*.plist files that firebase_options.dart is generated
// from.
const Map<String, String> _googleServerClientIds = {
  'development':
      '919227980868-tuenu6h2df1km03blnn0i8kqa4dinm6u.apps.googleusercontent.com',
  'staging':
      '364854499099-5cun3jhs7tu8b1titfv5fpuovjrqhha5.apps.googleusercontent.com',
  'production':
      '489413148337-bkukvjc1ht5k8vlroj2qkq1qmuf20d2p.apps.googleusercontent.com',
};

const bool _screenshotMode = bool.fromEnvironment('VV_SCREENSHOT_MODE');
const bool _screenshotSignedOut = bool.fromEnvironment(
  'VV_SCREENSHOT_SIGNED_OUT',
);
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
    if (_screenshotMode) {
      if (_screenshotSignedOut) {
        _currentUser = null;
        _isLoading = false;
        notifyListeners();
        return;
      }

      _signInForScreenshots();
      return;
    }

    _currentUser = _mapUser(_auth.currentUser);
    _authSubscription = _auth.authStateChanges().listen((firebaseUser) {
      _currentUser = _mapUser(firebaseUser);
      _isLoading = false;
      notifyListeners();
    });
  }

  Future<void> _signInForScreenshots() async {
    if (_screenshotEmail.isEmpty || _screenshotPassword.isEmpty) {
      debugPrint(
        'Screenshot mode enabled without demo credentials; using local demo user.',
      );
      _currentUser = User(
        uid: 'screenshot-demo-user',
        email: 'demo@vehicle-vitals.com',
        displayName: 'Demo User',
        emailVerified: true,
        providerIds: const ['password'],
      );
      _isLoading = false;
      notifyListeners();
      return;
    }

    try {
      await signInWithEmailAndPassword(_screenshotEmail, _screenshotPassword);
    } catch (e) {
      debugPrint('Screenshot auto sign-in failed: $e');
      _currentUser = User(
        uid: 'screenshot-demo-user',
        email: _screenshotEmail,
        displayName: 'Demo User',
        emailVerified: true,
        providerIds: const ['password'],
      );
      _isLoading = false;
      notifyListeners();
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
      throw FriendlyException(_friendlyAuthMessage(e, email.trim()));
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
      final user = _mapUser(_auth.currentUser ?? credential.user);
      _currentUser = user;
      notifyListeners();
      if (user == null) return null;
      return UserCredential(user: user);
    } on firebase_auth.FirebaseAuthException catch (e) {
      if (e.code == 'email-already-in-use') {
        throw FriendlyException(
          'An account already exists for this email. Sign in instead of creating another account.',
        );
      }
      if (e.code == 'weak-password') {
        throw FriendlyException(
          'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a symbol.',
        );
      }
      throw FriendlyException(
        e.message ?? 'Authentication failed. Please try again.',
      );
    }
  }

  Future<void> signOut() async {
    // _auth.signOut() clears FirebaseAuth's own persisted session (Keychain/
    // internal storage), not just this class's in-memory _currentUser. If it
    // throws and we just clear our own mirror, _init() repopulates
    // _currentUser from the still-persisted _auth.currentUser on next
    // launch -- the account silently comes back, which is a real problem on
    // a shared device and especially after account deletion. It's a local
    // storage write with no network dependency, so a transient failure is
    // usually worth a couple of quick retries before giving up.
    Object? lastError;
    for (var attempt = 0; attempt < 3; attempt++) {
      try {
        await _auth.signOut();
        lastError = null;
        break;
      } catch (e) {
        lastError = e;
        if (attempt < 2) {
          await Future.delayed(Duration(milliseconds: 200 * (attempt + 1)));
        }
      }
    }
    // Firebase's own signOut() above does not touch the native Google
    // session google_sign_in caches -- without this, choosing Google again
    // on a shared device can silently reuse the previous identity instead
    // of starting from a clean provider session. Only relevant if this
    // session actually initialized a Google client; best-effort since the
    // app's own state is already cleared regardless of the outcome.
    final googleSignIn = _googleSignInInstance;
    if (googleSignIn != null) {
      try {
        await googleSignIn.signOut();
      } catch (_) {
        // Non-fatal -- see comment above.
      }
    }
    _pendingLinkCredential = null;
    _pendingLinkEmail = null;
    _currentUser = null;
    notifyListeners();
    if (lastError != null) {
      // The persisted FirebaseAuth session may still be intact even though
      // our own state is now cleared -- surface this so a caller (e.g. the
      // account-deletion flow) can warn the user rather than silently
      // reporting success. Force-closing the app does NOT reliably clear
      // this (Keychain items can survive even an app reinstall on iOS), so
      // point at a real retry rather than a specific action that may not
      // actually help.
      throw FriendlyException(
        'Signed out of this session, but could not fully clear the device '
        'credential. Please try signing out again, or contact Support if '
        'you keep seeing your account after reopening the app.',
      );
    }
  }

  Future<void> resetPassword(String email) async {
    await _auth.sendPasswordResetEmail(email: email);
  }

  // Fetches the password policy actually enforced by Firebase for this
  // project (min length, required character classes) and validates
  // [password] against it in one round-trip. Pass a non-empty placeholder
  // (e.g. a single space) to just read the policy without a real candidate.
  Future<firebase_auth.PasswordValidationStatus> validatePassword(
    String password,
  ) {
    return _auth.validatePassword(_auth, password);
  }

  // Re-authenticates the current user with their password before a
  // sensitive operation (e.g. changing their password) that Firebase
  // requires a recent sign-in for.
  Future<void> reauthenticateWithPassword(String currentPassword) async {
    final user = _auth.currentUser;
    final email = user?.email;
    if (user == null || email == null) {
      throw FriendlyException('Sign in first before changing your password.');
    }

    final credential = firebase_auth.EmailAuthProvider.credential(
      email: email,
      password: currentPassword,
    );

    try {
      await user.reauthenticateWithCredential(credential);
    } on firebase_auth.FirebaseAuthException catch (e) {
      switch (e.code) {
        case 'wrong-password':
        case 'invalid-credential':
          throw FriendlyException('Current password is incorrect.');
        case 'too-many-requests':
          throw FriendlyException(
            'Too many attempts. Please wait and try again.',
          );
        case 'network-request-failed':
          throw FriendlyException(
            'Network error. Please check your connection and try again.',
          );
        default:
          throw FriendlyException(
            e.message ??
                'We could not verify your current password. Please try again.',
          );
      }
    }
  }

  // Updates the signed-in user's password. Firebase requires a recent
  // sign-in for this -- call reauthenticateWithPassword first if the
  // session may be stale.
  Future<void> updatePassword(String newPassword) async {
    try {
      await _auth.currentUser!.updatePassword(newPassword);
    } on firebase_auth.FirebaseAuthException catch (e) {
      if (e.code == 'weak-password') {
        throw FriendlyException(
          'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a symbol.',
        );
      }
      if (e.code == 'requires-recent-login') {
        throw FriendlyException(
          'Please verify your current password again and retry.',
        );
      }
      throw FriendlyException(
        e.message ?? 'We could not update your password. Please try again.',
      );
    }
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
      await _linkPendingProviderIfNeeded(credential.user);
      final user = _mapUser(_auth.currentUser ?? credential.user);
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
        throw FriendlyException(message);
      }
      throw FriendlyException(
        e.message ?? 'Apple sign-in failed. Please try again.',
      );
    }
  }

  google.GoogleSignIn? _googleSignInInstance;

  Future<google.GoogleSignIn> _googleSignIn() async {
    final existing = _googleSignInInstance;
    if (existing != null) return existing;

    final instance = google.GoogleSignIn.instance;
    await instance.initialize(
      serverClientId:
          _googleServerClientIds[DefaultFirebaseOptions.currentEnvironmentLabel],
    );
    _googleSignInInstance = instance;
    return instance;
  }

  Future<UserCredential?> signInWithGoogle() async {
    final googleSignIn = await _googleSignIn();

    google.GoogleSignInAccount googleAccount;
    try {
      googleAccount = await googleSignIn.authenticate();
    } on google.GoogleSignInException catch (e) {
      if (e.code == google.GoogleSignInExceptionCode.canceled) {
        return null;
      }
      throw FriendlyException('Google sign-in failed. Please try again.');
    }

    final idToken = googleAccount.authentication.idToken;
    if (idToken == null) {
      throw FriendlyException('Google sign-in failed. Please try again.');
    }

    final oauthCredential = firebase_auth.GoogleAuthProvider.credential(
      idToken: idToken,
    );

    try {
      final credential = await _auth.signInWithCredential(oauthCredential);
      await _linkPendingProviderIfNeeded(credential.user);
      final user = _mapUser(_auth.currentUser ?? credential.user);
      _currentUser = user;
      notifyListeners();
      if (user == null) return null;
      return UserCredential(user: user);
    } on firebase_auth.FirebaseAuthException catch (e) {
      if (e.code == 'account-exists-with-different-credential' ||
          e.code == 'credential-already-in-use') {
        _setPendingProviderLink(
          credential: oauthCredential,
          email: e.email ?? googleAccount.email,
        );
        throw FriendlyException(
          _buildProviderConflictMessage(e.email ?? googleAccount.email),
        );
      }
      throw FriendlyException(
        e.message ?? 'Google sign-in failed. Please try again.',
      );
    }
  }

  // Returns true if Google is now linked (including if it already was),
  // false if the user canceled the account chooser -- callers must not
  // report a cancellation as a successful link.
  Future<bool> linkCurrentUserWithGoogle() async {
    final currentUser = _auth.currentUser;
    if (currentUser == null) {
      throw Exception('Sign in first before linking Google.');
    }

    final googleSignIn = await _googleSignIn();
    google.GoogleSignInAccount googleAccount;
    try {
      googleAccount = await googleSignIn.authenticate();
    } on google.GoogleSignInException catch (e) {
      if (e.code == google.GoogleSignInExceptionCode.canceled) {
        return false;
      }
      throw Exception('Unable to link Google sign-in.');
    }

    final idToken = googleAccount.authentication.idToken;
    if (idToken == null) {
      throw Exception('Unable to link Google sign-in.');
    }

    final oauthCredential = firebase_auth.GoogleAuthProvider.credential(
      idToken: idToken,
    );

    try {
      await currentUser.linkWithCredential(oauthCredential);
      await currentUser.reload();
      _currentUser = _mapUser(_auth.currentUser);
      notifyListeners();
      return true;
    } on firebase_auth.FirebaseAuthException catch (e) {
      if (e.code == 'provider-already-linked') {
        return true;
      }
      if (e.code == 'credential-already-in-use') {
        throw Exception(
          'That Google identity is already linked to another account. Sign in with that account first if you need to consolidate data.',
        );
      }
      throw Exception(e.message ?? 'Unable to link Google sign-in.');
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
      final callable = functions.httpsCallable(
        'consolidateAccountDataCallable',
      );

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
      throw Exception('Failed to consolidate accounts: ${e.toString()}');
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
