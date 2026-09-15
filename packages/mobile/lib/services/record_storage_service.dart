import 'dart:io';
import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:url_launcher/url_launcher.dart';

import 'garage_scope.dart';

// Mirrors packages/web/src/shared/fileUtils.ts's supported file-type map, so
// mobile and web recognize (and, via storage.rules' isValidAttachmentUpload,
// accept) exactly the same attachment types. Without an explicit
// SettableMetadata.contentType, ref.putData() defaults to
// application/octet-stream, which storage.rules' size/content-type
// validation correctly rejects as an unidentifiable upload -- so every
// extension the app claims to support here must resolve to a real MIME type.
String _mimeTypeForExtension(String extension) {
  switch (extension.toLowerCase()) {
    // Documents
    case 'pdf':
      return 'application/pdf';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xls':
      return 'application/vnd.ms-excel';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'txt':
      return 'text/plain';
    case 'rtf':
      return 'application/rtf';
    case 'csv':
      return 'text/csv';
    // Images
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    case 'bmp':
      return 'image/bmp';
    case 'tiff':
      return 'image/tiff';
    case 'ico':
      return 'image/x-icon';
    case 'heic':
      return 'image/heic';
    case 'heif':
      return 'image/heif';
    // Video
    case 'mp4':
      return 'video/mp4';
    case 'avi':
      return 'video/x-msvideo';
    case 'mov':
      return 'video/quicktime';
    case 'mkv':
      return 'video/x-matroska';
    case 'wmv':
      return 'video/x-ms-wmv';
    case 'flv':
      return 'video/x-flv';
    case 'webm':
      return 'video/webm';
    // Audio
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    case 'aac':
      return 'audio/aac';
    case 'flac':
      return 'audio/flac';
    case 'm4a':
      return 'audio/mp4';
    case 'ogg':
      return 'audio/ogg';
    // Archives
    case 'zip':
      return 'application/zip';
    case 'rar':
      return 'application/vnd.rar';
    case '7z':
      return 'application/x-7z-compressed';
    case 'tar':
      return 'application/x-tar';
    case 'gz':
      return 'application/gzip';
    default:
      // Falls back to the true "unknown binary" type -- storage.rules
      // deliberately does not allowlist this, so an unrecognized extension
      // is rejected server-side rather than silently accepted.
      return 'application/octet-stream';
  }
}

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
      contentType: _mimeTypeForExtension(extension),
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
      contentType: _mimeTypeForExtension(extension),
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

  // Uploads a photo or document attached to a maintenance entry. Uses the
  // `maintenance/{entryId}/...` path segment (not `records/`) so the
  // backend's Storage-finalize trigger (parseAttachmentPath in the functions
  // repo) classifies it as `section: 'maintenance'` and, once the entry doc
  // exists, patches extracted analysis back onto the matching attachment
  // array entry.
  Future<Map<String, dynamic>> uploadMaintenanceAttachment(
    String vin,
    String entryId,
    PlatformFile file,
  ) async {
    final extension = file.extension?.trim().isNotEmpty == true
        ? file.extension!
        : 'bin';
    final context = await _resolveGarageContext();
    final path =
        '${buildVehicleStorageBasePath(context, vin)}/maintenance/$entryId/${DateTime.now().millisecondsSinceEpoch}.$extension';
    final ref = _storage.ref(path);
    final metadata = SettableMetadata(
      contentType: _mimeTypeForExtension(extension),
      customMetadata: {
        'originalName': file.name,
        'extension': extension,
        'vin': vin,
        'entryId': entryId,
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
