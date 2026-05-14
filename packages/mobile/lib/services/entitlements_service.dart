import 'package:cloud_functions/cloud_functions.dart';

class EntitlementsService {
  final FirebaseFunctions _functions;

  EntitlementsService({FirebaseFunctions? functions})
    : _functions = functions ?? FirebaseFunctions.instance;

  Future<Map<String, dynamic>> bootstrapEnterpriseContext() async {
    final callable = _functions.httpsCallable(
      'bootstrapEnterpriseContextCallable',
    );
    final response = await callable.call(<String, dynamic>{});
    final data = Map<String, dynamic>.from(response.data as Map? ?? const {});

    if (data['success'] != true) {
      throw Exception('Failed to bootstrap enterprise context');
    }

    return data;
  }

  Future<Map<String, dynamic>> getEffectiveEntitlements({String? orgId}) async {
    final callable = _functions.httpsCallable(
      'getEffectiveEntitlementsCallable',
    );
    final response = await callable.call({'orgId': orgId ?? ''});
    final data = Map<String, dynamic>.from(response.data as Map? ?? const {});

    if (data['success'] != true) {
      throw Exception('Failed to resolve effective entitlements');
    }

    return Map<String, dynamic>.from(
      data['entitlements'] as Map? ?? const <String, dynamic>{},
    );
  }
}
