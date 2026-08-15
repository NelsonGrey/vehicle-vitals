import 'package:cloud_functions/cloud_functions.dart';

import '../models/maintenance_attachment.dart';

// Wraps the backend's analyzeAttachmentTextCallable Cloud Function, which
// runs Gemini-based extraction (cost, service date, mileage, category) on a
// just-uploaded attachment and returns the result synchronously — the same
// function a Storage-finalize trigger also fires passively as a fallback,
// but calling it directly here lets the UI show results immediately instead
// of polling Firestore.
class AttachmentAnalysisService {
  final FirebaseFunctions _functions = FirebaseFunctions.instance;

  Future<AttachmentAnalysis> analyze(String vin, String storagePath) async {
    final result = await _functions
        .httpsCallable('analyzeAttachmentTextCallable')
        .call({'vin': vin, 'storagePath': storagePath});

    final data = Map<String, dynamic>.from(result.data as Map);
    return AttachmentAnalysis(
      extracted: AttachmentExtractedData.fromMap(
        Map<String, dynamic>.from(data['extracted'] as Map? ?? {}),
      ),
      confidence: (data['confidence'] as num?)?.toDouble() ?? 0.0,
    );
  }
}
