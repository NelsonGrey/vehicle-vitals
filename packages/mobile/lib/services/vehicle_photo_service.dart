import 'dart:convert';
import 'dart:io';

class VehiclePhotoService {
  List<String> _buildQueries({
    required String make,
    required String model,
    String? year,
    String? vehicleType,
  }) {
    final normalizedYear = (year ?? '').trim();
    final normalizedMake = make.trim();
    final normalizedModel = model.trim();
    final normalizedType = (vehicleType ?? '').trim();

    final core = [
      normalizedYear,
      normalizedMake,
      normalizedModel,
    ].where((part) => part.isNotEmpty).join(' ').trim();
    final withType = [
      core,
      normalizedType,
    ].where((part) => part.isNotEmpty).join(' ').trim();

    return [
      withType,
      core,
      '$normalizedMake $normalizedModel'.trim(),
      '$normalizedMake $normalizedModel vehicle'.trim(),
    ].where((query) => query.isNotEmpty).toSet().toList();
  }

  Future<Map<String, String>?> _searchWikipediaImage(String query) async {
    final uri = Uri.https('en.wikipedia.org', '/w/api.php', {
      'action': 'query',
      'format': 'json',
      'origin': '*',
      'generator': 'search',
      'gsrsearch': query,
      'gsrlimit': '5',
      'prop': 'pageimages|info',
      'piprop': 'thumbnail',
      'pithumbsize': '800',
      'inprop': 'url',
    });

    final client = HttpClient();
    try {
      final request = await client.getUrl(uri);
      final response = await request.close();
      if (response.statusCode < 200 || response.statusCode >= 300) {
        return null;
      }

      final body = await response.transform(utf8.decoder).join();
      final decoded = jsonDecode(body);
      if (decoded is! Map || decoded['query'] is! Map) {
        return null;
      }

      final queryData = decoded['query'] as Map;
      final pages = queryData['pages'];
      if (pages is! Map) {
        return null;
      }

      for (final page in pages.values) {
        if (page is! Map) {
          continue;
        }

        final thumbnail = page['thumbnail'];
        if (thumbnail is! Map || thumbnail['source'] is! String) {
          continue;
        }

        final sourceUrl = thumbnail['source'] as String;
        if (sourceUrl.trim().isEmpty) {
          continue;
        }

        return {
          'url': sourceUrl,
          'source': 'wikimedia',
          'attributionUrl': (page['fullurl'] ?? '').toString(),
          'attributionText': (page['title'] ?? '').toString(),
        };
      }

      return null;
    } finally {
      client.close(force: true);
    }
  }

  Future<Map<String, String>?> findVehiclePhotoFromWeb({
    required String make,
    required String model,
    String? year,
    String? vehicleType,
  }) async {
    final queries = _buildQueries(
      make: make,
      model: model,
      year: year,
      vehicleType: vehicleType,
    );

    for (final query in queries) {
      try {
        final result = await _searchWikipediaImage(query);
        if (result != null && (result['url'] ?? '').isNotEmpty) {
          return result;
        }
      } catch (_) {
        // Continue trying alternate queries.
      }
    }

    return null;
  }
}
