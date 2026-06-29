import 'package:cloud_functions/cloud_functions.dart';

class VehicleTransferService {
  VehicleTransferService({FirebaseFunctions? functions})
    : _functions = functions ?? FirebaseFunctions.instance;

  final FirebaseFunctions _functions;

  Future<Map<String, dynamic>> transferVehicle({
    required String vin,
    required String recipientEmail,
  }) async {
    final callable = _functions.httpsCallable('transferVehicleCallable');
    final response = await callable.call({
      'vin': vin,
      'recipientEmail': recipientEmail,
      'idempotencyKey':
          'transfer-$vin-${DateTime.now().millisecondsSinceEpoch}',
    });

    final data = Map<String, dynamic>.from(response.data as Map? ?? const {});
    if (data['success'] != true) {
      throw Exception((data['error'] ?? 'Vehicle transfer failed').toString());
    }

    return data;
  }
}
