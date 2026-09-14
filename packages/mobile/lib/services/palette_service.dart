import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../theme/design_tokens.dart';
import '../theme/palettes.dart';

/// Holds the user's selected color palette and keeps [AppDesignTokens]'s
/// active palette in sync with it, so every screen repaints in the right
/// colors as soon as the selection changes.
///
/// Mirrors EmailReminderService's direct Firestore read/write against the
/// flat `users/{uid}` document (no new subcollection -- see
/// project-global-stylesheet-todo memory for why that scattering was a
/// mistake not to repeat) and PremiumService's Provider/syncForAuthUser
/// registration style.
///
/// Read/write semantics: every read is always "read my own platform's
/// field" (`paletteMobile`) -- this class never branches on `linked`.
/// `linked` only changes what a *write* does: while linked, picking a
/// palette here also writes `paletteWeb` to the same value in the same
/// call, so the two platforms' fields never drift out of sync silently.
class PaletteService extends ChangeNotifier {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  PaletteId _paletteId = PaletteId.current;
  bool _linked = false;
  String? _lastSyncedUid;

  PaletteId get paletteId => _paletteId;
  bool get linked => _linked;

  Future<void> syncForAuthUser(String? uid) async {
    if (uid == _lastSyncedUid) {
      return;
    }
    _lastSyncedUid = uid;

    if (uid == null || uid.isEmpty) {
      _applyLocally(PaletteId.current, false);
      return;
    }

    try {
      final doc = await _firestore.collection('users').doc(uid).get();
      if (_lastSyncedUid != uid) return;
      final data = doc.data() ?? <String, dynamic>{};
      final paletteId = paletteIdFromName(data['paletteMobile'] as String?);
      final linked = (data['paletteLinked'] as bool?) ?? false;
    } catch (_) {
      // Non-fatal: keep whatever was showing (the baseline palette on a
      // fresh install) rather than blocking the app on a failed read.
    }
  }

  /// Select a palette. While [linked], also writes the web field so both
  /// platforms move together; otherwise only this platform's field moves.
  Future<void> setPalette(PaletteId id) async {
    _applyLocally(id, _linked);

    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) return;

    final update = <String, dynamic>{
      'paletteMobile': id.name,
      'updatedAt': FieldValue.serverTimestamp(),
    };
    if (_linked) {
      update['paletteWeb'] = id.name;
    }
    await _firestore
        .collection('users')
        .doc(uid)
        .set(update, SetOptions(merge: true));
  }

  /// Toggle linking. Turning linking on snaps the web field to this
  /// platform's current palette immediately, so the two never sit silently
  /// mismatched until the next manual pick.
  Future<void> setLinked(bool value) async {
    _linked = value;
    notifyListeners();

    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) return;

    final update = <String, dynamic>{
      'paletteLinked': value,
      'updatedAt': FieldValue.serverTimestamp(),
    };
    if (value) {
      update['paletteWeb'] = _paletteId.name;
    }
    await _firestore
        .collection('users')
        .doc(uid)
        .set(update, SetOptions(merge: true));
  }

  void _applyLocally(PaletteId id, bool linked) {
    _paletteId = id;
    _linked = linked;
    AppDesignTokens.currentPaletteId = id;
    notifyListeners();
  }
}
