int _toInt(dynamic value, [int fallback = 0]) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value.trim()) ?? fallback;
  return fallback;
}

class Vehicle {
  final String vin;
  final String make;
  final String model;
  final int year;
  final int mileage;
  final String vehicleStatus;
  final int recallsCount;
  final String? recallsSource;
  final String? engineType;
  final String? bodyClass;
  final String? fuelType;
  final String? driveType;
  final String? transmissionStyle;
  final String? trim;
  final String? vehicleType;
  final String? photoUrl;
  final String? photoPath;
  final String? photoSource;
  final String? photoAttributionUrl;
  final String? photoAttributionText;
  final List<Map<String, dynamic>>? recallsItems;
  final Map<String, dynamic>? vinProfile;
  final Map<String, dynamic>? vinInsights;
  final String? purchaseDate;
  final String? nextDueDate;
  final String? nextDueTask;
  final Map<String, dynamic>? documentPortfolio;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  // Server-precomputed health forecast (see
  // packages/functions/src/vehicleHealth.provider.ts) — read-only,
  // deliberately excluded from toMap() since the client never writes it;
  // the Firestore trigger recomputes it whenever the vehicle or its
  // maintenance history changes. See VehicleHealthCalculator.resolveSnapshot
  // for the freshness check + local-fallback logic that consumes this.
  final Map<String, dynamic>? vehicleHealthSnapshot;

  Vehicle({
    required this.vin,
    required this.make,
    required this.model,
    required this.year,
    required this.mileage,
    this.vehicleStatus = 'active',
    this.recallsCount = 0,
    this.recallsSource,
    this.engineType,
    this.bodyClass,
    this.fuelType,
    this.driveType,
    this.transmissionStyle,
    this.trim,
    this.vehicleType,
    this.photoUrl,
    this.photoPath,
    this.photoSource,
    this.photoAttributionUrl,
    this.photoAttributionText,
    this.recallsItems,
    this.vinProfile,
    this.vinInsights,
    this.purchaseDate,
    this.nextDueDate,
    this.nextDueTask,
    this.documentPortfolio,
    this.createdAt,
    this.updatedAt,
    this.vehicleHealthSnapshot,
  });

  factory Vehicle.fromMap(Map<String, dynamic> map) {
    return Vehicle(
      vin: map['vin'] ?? '',
      make: map['make'] ?? '',
      model: map['model'] ?? '',
      year: _toInt(map['year']),
      mileage: _toInt(map['mileage']),
      vehicleStatus: (map['vehicleStatus'] ?? 'active').toString(),
      recallsCount: _toInt(map['recallsCount']),
      recallsSource: map['recallsSource'],
      engineType: map['engineType'],
      bodyClass: map['bodyClass'],
      fuelType: map['fuelType'],
      driveType: map['driveType'],
      transmissionStyle: map['transmissionStyle'],
      trim: map['trim'],
      vehicleType: map['vehicleType'],
      photoUrl: map['photoUrl'],
      photoPath: map['photoPath'],
      photoSource: map['photoSource'],
      photoAttributionUrl: map['photoAttributionUrl'],
      photoAttributionText: map['photoAttributionText'],
      recallsItems: (map['recallsItems'] as List?)
          ?.map((item) => Map<String, dynamic>.from(item as Map))
          .toList(),
      vinProfile: map['vinProfile'] is Map
          ? Map<String, dynamic>.from(map['vinProfile'] as Map)
          : null,
      vinInsights: map['vinInsights'] is Map
          ? Map<String, dynamic>.from(map['vinInsights'] as Map)
          : null,
      purchaseDate: map['purchaseDate'],
      nextDueDate: map['nextDueDate'],
      nextDueTask: map['nextDueTask'],
      documentPortfolio: map['documentPortfolio'] is Map<String, dynamic>
          ? map['documentPortfolio'] as Map<String, dynamic>
          : null,
      createdAt: map['createdAt']?.toDate(),
      updatedAt: map['updatedAt']?.toDate(),
      vehicleHealthSnapshot: map['vehicleHealthSnapshot'] is Map
          ? Map<String, dynamic>.from(map['vehicleHealthSnapshot'] as Map)
          : null,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'vin': vin,
      'make': make,
      'model': model,
      'year': year,
      'mileage': mileage,
      'vehicleStatus': vehicleStatus,
      'recallsCount': recallsCount,
      'recallsSource': recallsSource,
      'engineType': engineType,
      'bodyClass': bodyClass,
      'fuelType': fuelType,
      'driveType': driveType,
      'transmissionStyle': transmissionStyle,
      'trim': trim,
      'vehicleType': vehicleType,
      'photoUrl': photoUrl,
      'photoPath': photoPath,
      'photoSource': photoSource,
      'photoAttributionUrl': photoAttributionUrl,
      'photoAttributionText': photoAttributionText,
      'recallsItems': recallsItems,
      'vinProfile': vinProfile,
      'vinInsights': vinInsights,
      'purchaseDate': purchaseDate,
      'nextDueDate': nextDueDate,
      'nextDueTask': nextDueTask,
      'documentPortfolio': documentPortfolio,
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
    String? vehicleStatus,
    int? recallsCount,
    String? recallsSource,
    String? engineType,
    String? bodyClass,
    String? fuelType,
    String? driveType,
    String? transmissionStyle,
    String? trim,
    String? vehicleType,
    String? photoUrl,
    String? photoPath,
    String? photoSource,
    String? photoAttributionUrl,
    String? photoAttributionText,
    List<Map<String, dynamic>>? recallsItems,
    Map<String, dynamic>? vinProfile,
    Map<String, dynamic>? vinInsights,
    String? purchaseDate,
    String? nextDueDate,
    String? nextDueTask,
    Map<String, dynamic>? documentPortfolio,
    DateTime? createdAt,
    DateTime? updatedAt,
    Map<String, dynamic>? vehicleHealthSnapshot,
  }) {
    return Vehicle(
      vin: vin ?? this.vin,
      make: make ?? this.make,
      model: model ?? this.model,
      year: year ?? this.year,
      mileage: mileage ?? this.mileage,
      vehicleStatus: vehicleStatus ?? this.vehicleStatus,
      recallsCount: recallsCount ?? this.recallsCount,
      recallsSource: recallsSource ?? this.recallsSource,
      engineType: engineType ?? this.engineType,
      bodyClass: bodyClass ?? this.bodyClass,
      fuelType: fuelType ?? this.fuelType,
      driveType: driveType ?? this.driveType,
      transmissionStyle: transmissionStyle ?? this.transmissionStyle,
      trim: trim ?? this.trim,
      vehicleType: vehicleType ?? this.vehicleType,
      photoUrl: photoUrl ?? this.photoUrl,
      photoPath: photoPath ?? this.photoPath,
      photoSource: photoSource ?? this.photoSource,
      photoAttributionUrl: photoAttributionUrl ?? this.photoAttributionUrl,
      photoAttributionText: photoAttributionText ?? this.photoAttributionText,
      recallsItems: recallsItems ?? this.recallsItems,
      vinProfile: vinProfile ?? this.vinProfile,
      vinInsights: vinInsights ?? this.vinInsights,
      purchaseDate: purchaseDate ?? this.purchaseDate,
      nextDueDate: nextDueDate ?? this.nextDueDate,
      nextDueTask: nextDueTask ?? this.nextDueTask,
      documentPortfolio: documentPortfolio ?? this.documentPortfolio,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      vehicleHealthSnapshot:
          vehicleHealthSnapshot ?? this.vehicleHealthSnapshot,
    );
  }

  int get requiredPortfolioItemCount {
    final categories = (documentPortfolio?['categories'] as List?) ?? [];
    var count = 0;

    for (final category in categories) {
      final items = (category is Map ? category['items'] as List? : null) ?? [];
      for (final item in items) {
        if (item is Map && item['required'] == true) {
          count += 1;
        }
      }
    }

    return count;
  }

  int get completedRequiredPortfolioItemCount {
    final categories = (documentPortfolio?['categories'] as List?) ?? [];
    var count = 0;

    for (final category in categories) {
      final items = (category is Map ? category['items'] as List? : null) ?? [];
      for (final item in items) {
        if (item is Map &&
            item['required'] == true &&
            item['status'] == 'ready') {
          count += 1;
        }
      }
    }

    return count;
  }

  // Mirrors web's optionalTotal/optionalComplete on getPortfolioRequiredProgress
  // — surfaced alongside the required count so "how complete are my records"
  // isn't understated by only counting required items.
  int get optionalPortfolioItemCount {
    final categories = (documentPortfolio?['categories'] as List?) ?? [];
    var count = 0;

    for (final category in categories) {
      final items = (category is Map ? category['items'] as List? : null) ?? [];
      for (final item in items) {
        if (item is Map && item['required'] != true) {
          count += 1;
        }
      }
    }

    return count;
  }

  int get completedOptionalPortfolioItemCount {
    final categories = (documentPortfolio?['categories'] as List?) ?? [];
    var count = 0;

    for (final category in categories) {
      final items = (category is Map ? category['items'] as List? : null) ?? [];
      for (final item in items) {
        if (item is Map &&
            item['required'] != true &&
            item['status'] == 'ready') {
          count += 1;
        }
      }
    }

    return count;
  }
}
