class Vehicle {
  final String vin;
  final String make;
  final String model;
  final int year;
  final int mileage;
  final String? purchaseDate;
  final String? nextDueDate;
  final String? nextDueTask;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Vehicle({
    required this.vin,
    required this.make,
    required this.model,
    required this.year,
    required this.mileage,
    this.purchaseDate,
    this.nextDueDate,
    this.nextDueTask,
    this.createdAt,
    this.updatedAt,
  });

  factory Vehicle.fromMap(Map<String, dynamic> map) {
    return Vehicle(
      vin: map['vin'] ?? '',
      make: map['make'] ?? '',
      model: map['model'] ?? '',
      year: map['year'] ?? 0,
      mileage: map['mileage'] ?? 0,
      purchaseDate: map['purchaseDate'],
      nextDueDate: map['nextDueDate'],
      nextDueTask: map['nextDueTask'],
      createdAt: map['createdAt']?.toDate(),
      updatedAt: map['updatedAt']?.toDate(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'vin': vin,
      'make': make,
      'model': model,
      'year': year,
      'mileage': mileage,
      'purchaseDate': purchaseDate,
      'nextDueDate': nextDueDate,
      'nextDueTask': nextDueTask,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }

  static Vehicle get defaultVehicle => Vehicle(
    vin: '',
    make: '',
    model: '',
    year: DateTime.now().year,
    mileage: 0,
  );

  Vehicle copyWith({
    String? vin,
    String? make,
    String? model,
    int? year,
    int? mileage,
    String? purchaseDate,
    String? nextDueDate,
    String? nextDueTask,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Vehicle(
      vin: vin ?? this.vin,
      make: make ?? this.make,
      model: model ?? this.model,
      year: year ?? this.year,
      mileage: mileage ?? this.mileage,
      purchaseDate: purchaseDate ?? this.purchaseDate,
      nextDueDate: nextDueDate ?? this.nextDueDate,
      nextDueTask: nextDueTask ?? this.nextDueTask,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
