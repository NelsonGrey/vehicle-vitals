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

      // A newer call may have already retargeted this service at a
      // different user (or signed out) while this read was in flight --
      // applying a stale response now would show user A's palette in
      // user B's session.
      if (uid != _lastSyncedUid) {
        return;
      }

      final data = doc.data() ?? <String, dynamic>{};
      // Firestore has no schema, so type each field independently rather
      // than an unconditional `as` cast -- a malformed value in one field
      // (e.g. from a bad write elsewhere) shouldn't throw and discard an
      // otherwise-readable document via the catch below.
      final rawPalette = data['paletteMobile'];
      final paletteId = paletteIdFromName(
        rawPalette is String ? rawPalette : null,
      );
      final rawLinked = data['paletteLinked'];
      final linked = rawLinked is bool ? rawLinked : false;
      _applyLocally(paletteId, linked);
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
