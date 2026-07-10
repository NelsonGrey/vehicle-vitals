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

class Maintenance {
  final String id;
  final String title;
  final String notes;
  final String mileage;
  final double cost;
  final String performedBy;
  final String coverage;
  final DateTime date;
  final DateTime createdAt;
  final DateTime updatedAt;

  Maintenance({
    required this.id,
    required this.title,
    this.notes = '',
    this.mileage = '',
    this.cost = 0.0,
    this.performedBy = 'mechanic',
    this.coverage = 'parts_and_labor',
    required this.date,
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
      performedBy: (map['performedBy'] ?? 'mechanic').toString(),
      coverage: (map['coverage'] ?? 'parts_and_labor').toString(),
      date: _parseDate(map['date']),
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
      coverage: coverage ?? this.coverage,
      date: date ?? this.date,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
