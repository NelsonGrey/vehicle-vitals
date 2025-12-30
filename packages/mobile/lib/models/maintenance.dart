class Maintenance {
  final String id;
  final String title;
  final String notes;
  final double cost;
  final DateTime date;
  final DateTime createdAt;
  final DateTime updatedAt;

  Maintenance({
    required this.id,
    required this.title,
    this.notes = '',
    this.cost = 0.0,
    required this.date,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Maintenance.fromMap(Map<String, dynamic> map, String docId) {
    return Maintenance(
      id: docId,
      title: map['title'] ?? '',
      notes: map['notes'] ?? '',
      cost: (map['cost'] ?? 0.0).toDouble(),
      date: map['date'] != null
          ? DateTime.fromMillisecondsSinceEpoch(
              map['date'].millisecondsSinceEpoch,
            )
          : DateTime.now(),
      createdAt: map['createdAt'] != null
          ? DateTime.fromMillisecondsSinceEpoch(
              map['createdAt'].millisecondsSinceEpoch,
            )
          : DateTime.now(),
      updatedAt: map['updatedAt'] != null
          ? DateTime.fromMillisecondsSinceEpoch(
              map['updatedAt'].millisecondsSinceEpoch,
            )
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'title': title,
      'notes': notes,
      'cost': cost,
      'date': date,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }

  Maintenance copyWith({
    String? id,
    String? title,
    String? notes,
    double? cost,
    DateTime? date,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Maintenance(
      id: id ?? this.id,
      title: title ?? this.title,
      notes: notes ?? this.notes,
      cost: cost ?? this.cost,
      date: date ?? this.date,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
