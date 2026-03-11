import 'dart:io';
import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';

class RecordStorageService {
  final FirebaseStorage _storage = FirebaseStorage.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  String get _userId {
    final user = _auth.currentUser;
    if (user == null) {
      throw Exception('Not authenticated');
    }
    return user.uid;
  }

  Future<Map<String, dynamic>> uploadVehicleRecordFile(
    String vin,
    String recordId,
    PlatformFile file,
  ) async {
    final extension = file.extension?.trim().isNotEmpty == true
        ? file.extension!
        : 'bin';
    final path =
        'users/$_userId/vehicles/$vin/records/$recordId/${DateTime.now().millisecondsSinceEpoch}.$extension';
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

  Future<void> deleteVehicleRecordFile(String path) async {
    await _storage.ref(path).delete();
  }
}
