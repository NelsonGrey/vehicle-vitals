import 'package:cloud_functions/cloud_functions.dart';

const bool _screenshotMode = bool.fromEnvironment('VV_SCREENSHOT_MODE');

/// Mirrors packages/functions/src/manuals.provider.ts's
/// OwnerManualDocument.
class OwnerManualDocument {
  final String id;
  final String title;
  final String language;
  final String format;
  final String url;
  final int? publishedYear;
  final String source;

  const OwnerManualDocument({
    required this.id,
    required this.title,
    required this.language,
    required this.format,
    required this.url,
    required this.publishedYear,
    required this.source,
  });

  factory OwnerManualDocument.fromMap(Map<String, dynamic> map) {
    return OwnerManualDocument(
      id: (map['id'] ?? '').toString(),
      title: (map['title'] ?? '').toString(),
      language: (map['language'] ?? 'en').toString(),
      format: (map['format'] ?? 'url').toString(),
      url: (map['url'] ?? '').toString(),
      publishedYear: (map['publishedYear'] as num?)?.round(),
      source: (map['source'] ?? '').toString(),
    );
  }
}

/// Fetches real, manufacturer-specific owner-manual portal links for this
/// vehicle (see packages/functions/src/manuals.provider.ts) from the
/// server.
class ManualsService {
  final FirebaseFunctions _functions;

  ManualsService({FirebaseFunctions? functions})
    : _functions = functions ?? FirebaseFunctions.instance;

  Future<List<OwnerManualDocument>> getOwnerManuals({
    required String vin,
  }) async {
    if (_screenshotMode) {
      return const [
        OwnerManualDocument(
          id: 'demo-owner-manual-portal',
          title: 'Owner Manual Portal',
          language: 'en',
          format: 'url',
          url: 'https://www.nhtsa.gov/vehicle',
          publishedYear: 2023,
          source: 'oem_portal',
        ),
      ];
    }

    final callable = _functions.httpsCallable('getOwnerManualsCallable');
    final response = await callable.call(<String, dynamic>{'vin': vin});
    final data = Map<String, dynamic>.from(response.data as Map? ?? const {});

    if (data['success'] != true) {
      throw Exception(
        data['error']?.toString() ?? 'Failed to fetch owner manuals',
      );
    }

    final rawManuals = (data['manuals'] as List?) ?? [];
    return rawManuals
        .map(
          (m) => OwnerManualDocument.fromMap(Map<String, dynamic>.from(m as Map)),
        )
        .toList();
  }
}
