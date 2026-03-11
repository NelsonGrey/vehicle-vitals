class Vehicle {
  final String vin;
  final String make;
  final String model;
  final int year;
  final int mileage;
  final int recallsCount;
  final String? recallsSource;
  final String? engineType;
  final String? bodyClass;
  final String? fuelType;
  final String? driveType;
  final String? transmissionStyle;
  final String? trim;
  final String? vehicleType;
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
    this.recallsCount = 0,
    this.recallsSource,
    this.engineType,
    this.bodyClass,
    this.fuelType,
    this.driveType,
    this.transmissionStyle,
    this.trim,
    this.vehicleType,
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
      recallsCount: map['recallsCount'] ?? 0,
      recallsSource: map['recallsSource'],
      engineType: map['engineType'],
      bodyClass: map['bodyClass'],
      fuelType: map['fuelType'],
      driveType: map['driveType'],
      transmissionStyle: map['transmissionStyle'],
      trim: map['trim'],
      vehicleType: map['vehicleType'],
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
      'recallsCount': recallsCount,
      'recallsSource': recallsSource,
      'engineType': engineType,
      'bodyClass': bodyClass,
      'fuelType': fuelType,
      'driveType': driveType,
      'transmissionStyle': transmissionStyle,
      'trim': trim,
      'vehicleType': vehicleType,
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
    int? recallsCount,
    String? recallsSource,
    String? engineType,
    String? bodyClass,
    String? fuelType,
    String? driveType,
    String? transmissionStyle,
    String? trim,
    String? vehicleType,
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
      recallsCount: recallsCount ?? this.recallsCount,
      recallsSource: recallsSource ?? this.recallsSource,
      engineType: engineType ?? this.engineType,
      bodyClass: bodyClass ?? this.bodyClass,
      fuelType: fuelType ?? this.fuelType,
      driveType: driveType ?? this.driveType,
      transmissionStyle: transmissionStyle ?? this.transmissionStyle,
      trim: trim ?? this.trim,
      vehicleType: vehicleType ?? this.vehicleType,
      purchaseDate: purchaseDate ?? this.purchaseDate,
      nextDueDate: nextDueDate ?? this.nextDueDate,
      nextDueTask: nextDueTask ?? this.nextDueTask,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
