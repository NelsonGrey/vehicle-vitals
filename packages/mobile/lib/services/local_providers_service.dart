import 'package:cloud_functions/cloud_functions.dart';

class LocalProvidersService {
  final FirebaseFunctions _functions;

  LocalProvidersService({FirebaseFunctions? functions})
    : _functions = functions ?? FirebaseFunctions.instance;

  Future<Map<String, dynamic>> getLocalServiceProviders({
    required String locationQuery,
    int radiusMiles = 25,
    int maxResults = 8,
    String vehicleMake = '',
    String providerType = 'all',
  }) async {
    final callable = _functions.httpsCallable(
      'getLocalServiceProvidersCallable',
    );
    final response = await callable.call({
      'locationQuery': locationQuery,
      'radiusMiles': radiusMiles,
      'maxResults': maxResults,
      'vehicleMake': vehicleMake,
      'providerType': providerType,
    });

    final data = Map<String, dynamic>.from(response.data as Map? ?? const {});
    if (data['success'] != true) {
      throw Exception((data['error'] ?? 'Provider lookup failed').toString());
    }

    return {
      'source': (data['source'] ?? 'unknown').toString(),
      'locationQuery': (data['locationQuery'] ?? locationQuery).toString(),
      'radiusMiles': (data['radiusMiles'] ?? radiusMiles) as num,
      'providerType': (data['providerType'] ?? providerType).toString(),
      'providers': List<Map<String, dynamic>>.from(
        (data['providers'] as List? ?? const <dynamic>[]).map(
          (item) => Map<String, dynamic>.from(item as Map),
        ),
      ),
    };
  }
}
