// AI-extracted data for a maintenance attachment (receipt, invoice, or
// photo). Shape must match what the backend's `analyzeAttachmentTextCallable`
// / `analyzeUploadedAttachment` Cloud Functions write, since either the
// client (immediately, from the callable's return value) or the backend's
// passive Storage-finalize trigger (eventually, as a fallback) can populate
// this on the same attachment record.
class AttachmentExtractedData {
  final String? documentCategory; // receipt | invoice | image | document | other
  final String? serviceType;
  final double? totalCost;
  final String? currency;
  final String? serviceDate; // ISO 8601 date string, e.g. "2025-10-03"
  final int? mileage;

  const AttachmentExtractedData({
    this.documentCategory,
    this.serviceType,
    this.totalCost,
    this.currency,
    this.serviceDate,
    this.mileage,
  });

  factory AttachmentExtractedData.fromMap(Map<String, dynamic> map) {
    return AttachmentExtractedData(
      documentCategory: map['documentCategory']?.toString(),
      serviceType: map['serviceType']?.toString(),
      totalCost: (map['totalCost'] as num?)?.toDouble(),
      currency: map['currency']?.toString(),
      serviceDate: map['serviceDate']?.toString(),
      mileage: (map['mileage'] as num?)?.toInt(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      if (documentCategory != null) 'documentCategory': documentCategory,
      if (serviceType != null) 'serviceType': serviceType,
      if (totalCost != null) 'totalCost': totalCost,
      if (currency != null) 'currency': currency,
      if (serviceDate != null) 'serviceDate': serviceDate,
      if (mileage != null) 'mileage': mileage,
    };
  }

  bool get isEmpty =>
      documentCategory == null &&
      serviceType == null &&
      totalCost == null &&
      serviceDate == null &&
      mileage == null;
}

class AttachmentAnalysis {
  final AttachmentExtractedData extracted;
  // 0.05-0.95. See functions repo's buildAttachmentAnalysis for how this is
  // computed — roughly, how many fields got populated plus whether Gemini
  // and the regex-heuristic fallback agree on cost.
  final double confidence;

  const AttachmentAnalysis({required this.extracted, required this.confidence});

  factory AttachmentAnalysis.fromMap(Map<String, dynamic> map) {
    return AttachmentAnalysis(
      extracted: AttachmentExtractedData.fromMap(
        (map['extracted'] as Map?)?.cast<String, dynamic>() ?? const {},
      ),
      confidence: (map['confidence'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toMap() {
    return {'extracted': extracted.toMap(), 'confidence': confidence};
  }
}

// A file (photo or document) attached to a maintenance entry. Stored in the
// entry's Firestore doc under an `attachments` array — this exact shape
// (particularly the `path` field) is what the backend's Storage-finalize
// trigger matches against to merge in `analysis` after the fact, so this
// must not diverge from what the Cloud Function expects.
class MaintenanceAttachment {
  final String path;
  final String url;
  final String name;
  final String type; // file extension, e.g. "jpg", "pdf"
  final int size;
  final AttachmentAnalysis? analysis;

  const MaintenanceAttachment({
    required this.path,
    required this.url,
    required this.name,
    required this.type,
    required this.size,
    this.analysis,
  });

  factory MaintenanceAttachment.fromMap(Map<String, dynamic> map) {
    final analysisMap = (map['analysis'] as Map?)?.cast<String, dynamic>();
    return MaintenanceAttachment(
      path: map['path']?.toString() ?? '',
      url: map['url']?.toString() ?? '',
      name: map['name']?.toString() ?? '',
      type: map['type']?.toString() ?? '',
      size: (map['size'] as num?)?.toInt() ?? 0,
      analysis: analysisMap != null
          ? AttachmentAnalysis.fromMap(analysisMap)
          : null,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'path': path,
      'url': url,
      'name': name,
      'type': type,
      'size': size,
      if (analysis != null) 'analysis': analysis!.toMap(),
    };
  }

  MaintenanceAttachment copyWith({AttachmentAnalysis? analysis}) {
    return MaintenanceAttachment(
      path: path,
      url: url,
      name: name,
      type: type,
      size: size,
      analysis: analysis ?? this.analysis,
    );
  }
}
