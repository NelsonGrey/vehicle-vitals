DateTime _parseDate(dynamic value) {
  if (value == null) return DateTime.now();
  if (value is DateTime) return value;
  if (value is String) return DateTime.tryParse(value) ?? DateTime.now();
  if (value is int) return DateTime.fromMillisecondsSinceEpoch(value);
  // Firestore Timestamp — duck-typed so this model doesn't need to depend
  // on cloud_firestore directly.
  try {
    return DateTime.fromMillisecondsSinceEpoch(
      (value as dynamic).millisecondsSinceEpoch as int,
    );
  } catch (_) {
    return DateTime.now();
  }
}

// Mirrors _parseDate's fallback conditions exactly, but reports whether a
// real date was actually present instead of silently defaulting to "now."
// Consumers (notably VehicleHealthCalculator) need this distinction: a
// missing/malformed date is not the same as "serviced today," and treating
// it as such fabricates a high-confidence forecast from data that isn't
// there. Web's JS implementation represents this natively via
// date-can-be-undefined; Dart's `date` field is non-nullable everywhere
// else in the app, so this flag is the least invasive way to preserve the
// same distinction without making `date` nullable throughout.
bool _isDateKnown(dynamic value) {
  if (value == null) return false;
  if (value is DateTime) return true;
  if (value is String) return DateTime.tryParse(value) != null;
  if (value is int) return true;
  try {
    (value as dynamic).millisecondsSinceEpoch as int;
    return true;
  } catch (_) {
    return false;
  }
}

class Maintenance {
  final String id;
  final String title;
  final String notes;
  final String mileage;
  final double cost;
  final String performedBy;
  // Shop/provider name for entries where performedBy != 'self'. Mirrors
  // packages/web's maintenance entry providerName field so "who serviced
  // this" is consistent across platforms and feeds the Shops & Services
  // screen's "Places You've Used" list on both.
  final String providerName;
  final String coverage;
  final DateTime date;
  // False when `date` had to be fabricated as DateTime.now() because the
  // source data was missing or malformed — see _isDateKnown. Defaults to
  // true for entries constructed directly by the app (e.g. a new entry
  // dated "today" intentionally), since only the fromMap fallback path
  // represents genuinely unknown data.
  final bool hasKnownDate;
  final DateTime createdAt;
  final DateTime updatedAt;

  Maintenance({
    required this.id,
    required this.title,
    this.notes = '',
    this.mileage = '',
    this.cost = 0.0,
    this.performedBy = 'repair_shop',
    this.providerName = '',
    this.coverage = 'parts_and_labor',
    required this.date,
    this.hasKnownDate = true,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Maintenance.fromMap(Map<String, dynamic> map, String docId) {
    return Maintenance(
      id: docId,
      title: map['title'] ?? '',
      notes: map['notes'] ?? '',
      mileage: (map['mileage'] ?? '').toString(),
      cost: (map['cost'] ?? 0.0).toDouble(),
      performedBy: (map['performedBy'] ?? 'repair_shop').toString(),
      providerName: (map['providerName'] ?? '').toString(),
      coverage: (map['coverage'] ?? 'parts_and_labor').toString(),
      date: _parseDate(map['date']),
      hasKnownDate: _isDateKnown(map['date']),
      createdAt: _parseDate(map['createdAt']),
      updatedAt: _parseDate(map['updatedAt']),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'title': title,
      'notes': notes,
      'mileage': mileage,
      'cost': cost,
      'performedBy': performedBy,
      'providerName': providerName,
      'coverage': coverage,
      'date': date,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }

  Maintenance copyWith({
    String? id,
    String? title,
    String? notes,
    String? mileage,
    double? cost,
    String? performedBy,
    String? providerName,
    String? coverage,
    DateTime? date,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Maintenance(
      id: id ?? this.id,
      title: title ?? this.title,
      notes: notes ?? this.notes,
      mileage: mileage ?? this.mileage,
      cost: cost ?? this.cost,
      performedBy: performedBy ?? this.performedBy,
      providerName: providerName ?? this.providerName,
      coverage: coverage ?? this.coverage,
      date: date ?? this.date,
      // An explicit date passed to copyWith (e.g. a user editing the entry)
      // is by definition known; only carry forward the fabricated-date flag
      // when the date itself isn't being changed.
      hasKnownDate: date != null ? true : hasKnownDate,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
