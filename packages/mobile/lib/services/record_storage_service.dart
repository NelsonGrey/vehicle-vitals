import 'dart:io';
import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:url_launcher/url_launcher.dart';

import 'garage_scope.dart';

class RecordStorageService {
  final FirebaseStorage _storage = FirebaseStorage.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  String get _userId {
    final user = _auth.currentUser;
    if (user == null) {
      throw Exception('Not authenticated');
    }
    return user.uid;
  }

  Future<GarageContext> _resolveGarageContext() async {
    final memberships = await _db
        .collection('users')
        .doc(_userId)
        .collection('orgMemberships')
        .where('status', isEqualTo: 'active')
        .limit(1)
        .get();

    if (memberships.docs.isEmpty) {
      return GarageContext(userId: _userId);
    }

    final orgId = memberships.docs.first.id;
    final orgSnapshot = await _db.collection('orgs').doc(orgId).get();
    final orgData = orgSnapshot.data() ?? <String, dynamic>{};

    return GarageContext(
      userId: _userId,
      orgId: orgId,
      orgType: orgData['type']?.toString(),
      garageStorageMode:
          orgData['garageStorageMode']?.toString() ?? 'user_scoped',
    );
  }

  Future<Map<String, dynamic>> uploadVehicleRecordFile(
    String vin,
    String recordId,
    PlatformFile file,
  ) async {
    final extension = file.extension?.trim().isNotEmpty == true
        ? file.extension!
        : 'bin';
    final context = await _resolveGarageContext();
    final path =
        '${buildVehicleStorageBasePath(context, vin)}/records/$recordId/${DateTime.now().millisecondsSinceEpoch}.$extension';
    final ref = _storage.ref(path);
    final metadata = SettableMetadata(
      customMetadata: {
        'originalName': file.name,
        'extension': extension,
        'vin': vin,
        'recordId': recordId,
      },
    );

    UploadTask uploadTask;
    final Uint8List? bytes = file.bytes;
    if (bytes != null) {
      uploadTask = ref.putData(bytes, metadata);
    } else if (file.path != null) {
      uploadTask = ref.putFile(File(file.path!), metadata);
    } else {
      throw Exception('Unable to read selected file');
    }

    await uploadTask;
    final url = await ref.getDownloadURL();

    return {
      'name': file.name,
      'url': url,
      'path': path,
      'size': file.size,
      'type': extension,
    };
  }

  Future<Map<String, dynamic>> uploadVehiclePhoto(
    String vin,
    PlatformFile file,
  ) async {
    final extension = file.extension?.trim().isNotEmpty == true
        ? file.extension!
        : 'jpg';
    final context = await _resolveGarageContext();
    final path =
        '${buildVehicleStorageBasePath(context, vin)}/photo/${DateTime.now().millisecondsSinceEpoch}.$extension';
    final ref = _storage.ref(path);
    final metadata = SettableMetadata(
      customMetadata: {
        'originalName': file.name,
        'extension': extension,
        'vin': vin,
        'assetType': 'vehicle_photo',
      },
    );

    UploadTask uploadTask;
    final Uint8List? bytes = file.bytes;
    if (bytes != null) {
      uploadTask = ref.putData(bytes, metadata);
    } else if (file.path != null) {
      uploadTask = ref.putFile(File(file.path!), metadata);
    } else {
      throw Exception('Unable to read selected image');
    }

    await uploadTask;
    final url = await ref.getDownloadURL();

    return {
      'name': file.name,
      'url': url,
      'path': path,
      'size': file.size,
      'type': extension,
      'source': 'user_upload',
    };
  }

  Future<void> deleteVehicleRecordFile(String path) async {
    await _storage.ref(path).delete();
  }

  Future<void> deleteVehiclePhoto(String path) async {
    await _storage.ref(path).delete();
  }

  Future<void> openVehicleRecordFile(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null) {
      throw Exception('Invalid attachment URL');
    }

    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!launched) {
      throw Exception('Unable to open attachment');
    }
  }
}
