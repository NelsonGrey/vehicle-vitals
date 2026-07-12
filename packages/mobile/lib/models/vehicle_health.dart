import 'dart:math' as math;

import 'maintenance.dart';
import 'vehicle.dart';

class VehicleHealthComponent {
  final String label;
  final String status;
  final String confidence;
  final double? remainingPercent;
  final int? remainingMiles;
  final int? remainingDays;
  final int? estimatedDueMileage;
  final DateTime? estimatedDueDate;
  final int costLow;
  final int costHigh;

  VehicleHealthComponent({
    required this.label,
    required this.status,
    required this.confidence,
    required this.remainingPercent,
    this.remainingMiles,
    this.remainingDays,
    this.estimatedDueMileage,
    this.estimatedDueDate,
    required this.costLow,
    required this.costHigh,
  });
}

class VehicleHealthSnapshot {
  final String vin;
  final String vehicleLabel;
  final int overallHealthScore;
  final String accuracyTip;
  final List<VehicleHealthComponent> components;
  final String? nextLikelyService;
  final int estimatedMilesPerMonth;
  final int estimatedSpend90dLow;
  final int estimatedSpend90dHigh;
  final int estimatedSpend12mLow;
  final int estimatedSpend12mHigh;
  final int estimatedSpend36mLow;
  final int estimatedSpend36mHigh;
  final bool missingServiceHistory;
  final int lowConfidenceCount;
  // Mirrors overallConfidenceScore/overallConfidenceBand in
  // packages/shared/src/vehicleHealth.js, consumed there by web's headline
  // gauge sublabel ("{band} confidence"). Previously absent here, so mobile
  // had no equivalent overall trust signal.
  final double overallConfidenceScore;
  final String overallConfidenceBand;

  VehicleHealthSnapshot({
    required this.vin,
    required this.vehicleLabel,
    required this.overallHealthScore,
    required this.accuracyTip,
    required this.components,
    this.nextLikelyService,
    required this.estimatedMilesPerMonth,
    required this.estimatedSpend90dLow,
    required this.estimatedSpend90dHigh,
    required this.estimatedSpend12mLow,
    required this.estimatedSpend12mHigh,
    required this.estimatedSpend36mLow,
    required this.estimatedSpend36mHigh,
    required this.missingServiceHistory,
    required this.lowConfidenceCount,
    required this.overallConfidenceScore,
    required this.overallConfidenceBand,
  });
}

/// Component interval/cost table. Mirrors packages/shared/src/vehicleHealth.js's
/// VEHICLE_HEALTH_COMPONENTS exactly, so mobile and web compute the same
/// forecast from the same data. Wipers intentionally has no mileage interval,
/// matching the shared package.
class _HealthComponentSpec {
  final String id;
  final String label;
  final int? intervalMiles;
  final int intervalDays;
  final int costLow;
  final int costHigh;

  const _HealthComponentSpec({
    required this.id,
    required this.label,
    required this.intervalMiles,
    required this.intervalDays,
    required this.costLow,
    required this.costHigh,
  });
}

const List<_HealthComponentSpec> _kComponents = [
  _HealthComponentSpec(
    id: 'oil_change',
    label: 'Oil',
    intervalMiles: 5000,
    intervalDays: 180,
    costLow: 70,
    costHigh: 140,
  ),
  _HealthComponentSpec(
    id: 'tire_rotation',
    label: 'Rotation',
    intervalMiles: 6000,
    intervalDays: 240,
    costLow: 25,
    costHigh: 60,
  ),
  _HealthComponentSpec(
    id: 'tire_replacement',
    label: 'Tires',
    intervalMiles: 50000,
    intervalDays: 1460,
    costLow: 600,
    costHigh: 1400,
  ),
  _HealthComponentSpec(
    id: 'brake_service',
    label: 'Brakes',
    intervalMiles: 40000,
    intervalDays: 1095,
    costLow: 300,
    costHigh: 900,
  ),
  _HealthComponentSpec(
    id: 'battery_replacement',
    label: 'Battery',
    intervalMiles: 45000,
    intervalDays: 1460,
    costLow: 160,
    costHigh: 320,
  ),
  _HealthComponentSpec(
    id: 'wiper_replacement',
    label: 'Wipers',
    intervalMiles: null,
    intervalDays: 365,
    costLow: 20,
    costHigh: 60,
  ),
];

class _Anchor {
  final String source; // 'record' or 'default'
  final DateTime? date;
  final int? mileage;
  final bool hasDate;
  final bool hasMileage;

  const _Anchor({
    required this.source,
    this.date,
    this.mileage,
    required this.hasDate,
    required this.hasMileage,
  });
}

class VehicleHealthCalculator {
  static const int _defaultMonthlyMiles = 900;

  static int _parseMileage(dynamic value) {
    final parsed = int.tryParse(
      (value?.toString() ?? '').replaceAll(RegExp(r'[^0-9]'), ''),
    );
    return parsed ?? 0;
  }

  // Rounds rather than floors (Duration.inDays truncates toward zero), to
  // match packages/shared/src/vehicleHealth.js's Math.round — otherwise the
  // same two timestamps can produce an off-by-one-day divergence in
  // elapsed/remaining days (and therefore status/confidence) between web
  // and mobile for the same vehicle.
  static int _daysBetween(DateTime start, DateTime end) {
    final ms = end.difference(start).inMilliseconds;
    return math.max(0, (ms / 86400000).round());
  }

  static DateTime _addDays(DateTime date, int days) =>
      date.add(Duration(days: days));

  /// How many times a component recurs within a forecast window, given how
  /// soon it's next due and how often it repeats. Occurrence count is
  /// derived independently from the days-based and miles-based clocks
  /// (whichever the component uses), taking the larger of the two — a
  /// component due via either clock is priced for how often that clock
  /// actually recurs within the window, not just whether it's due at least
  /// once. Mirrors countOccurrencesInWindow in
  /// packages/shared/src/vehicleHealth.js.
  static int countOccurrencesInWindow({
    required int? remainingDays,
    required int? intervalDays,
    required int? remainingMiles,
    required int? intervalMiles,
    required int horizonDays,
    required int horizonMiles,
  }) {
    var occurrences = 0;

    if (remainingDays != null &&
        intervalDays != null &&
        intervalDays > 0 &&
        remainingDays <= horizonDays) {
      occurrences = math.max(
        occurrences,
        1 + ((horizonDays - remainingDays) / intervalDays).floor(),
      );
    }

    if (remainingMiles != null &&
        intervalMiles != null &&
        intervalMiles > 0 &&
        remainingMiles <= horizonMiles) {
      occurrences = math.max(
        occurrences,
        1 + ((horizonMiles - remainingMiles) / intervalMiles).floor(),
      );
    }

    return occurrences;
  }

  static double _clampD(double value, double min, double max) =>
      value < min ? min : (value > max ? max : value);

  /// Mirrors inferHealthComponentIds in packages/shared/src/vehicleHealth.js.
  static List<String> _inferComponentIds(Maintenance entry) {
    final text = '${entry.title} ${entry.notes}'.toLowerCase();
    final ids = <String>[];

    // Each of oil/brake/battery requires both a component term AND a
    // service-action term, the same way tire_replacement already does below
    // — a bare mention of the component ("brake noise inspection, no work
    // performed", "checked battery terminals, still good") must not reset
    // the forecast to "just serviced," or the app confidently reports a
    // safety-relevant component (brakes) as freshly done when nothing was
    // actually replaced.
    final hasServiceAction =
        text.contains('replace') ||
        text.contains('replacement') ||
        text.contains('replaced') ||
        text.contains('install') ||
        text.contains('installed') ||
        text.contains('change') ||
        text.contains('changed') ||
        text.contains('service') ||
        text.contains('serviced') ||
        text.contains('flush') ||
        text.contains('flushed');

    final hasOilTerm = text.contains('oil');
    if ((hasOilTerm && hasServiceAction) ||
        RegExp(r'filter change|lubrication').hasMatch(text)) {
      ids.add('oil_change');
    }
    if (RegExp(
      r'tire rotation|rotate tires|rotate tire|rotated tires|rotated tire',
    ).hasMatch(text)) {
      ids.add('tire_rotation');
    }
    final hasTireTerm = text.contains('tire') || text.contains('tires');
    final hasTireReplacementAction =
        text.contains('replace') ||
        text.contains('replacement') ||
        text.contains('install') ||
        text.contains('installed') ||
        text.contains('mounted');
    if (hasTireTerm && hasTireReplacementAction) {
      ids.add('tire_replacement');
    }
    final hasBrakeTerm =
        text.contains('brake') ||
        text.contains('brakes') ||
        text.contains('rotor') ||
        text.contains('rotors') ||
        text.contains('caliper') ||
        text.contains('calipers');
    final hasBrakeServiceAction =
        hasServiceAction || text.contains('pad') || text.contains('pads');
    if (hasBrakeTerm && hasBrakeServiceAction) {
      ids.add('brake_service');
    }
    final hasBatteryServiceAction = hasServiceAction || text.contains('new');
    if (text.contains('battery') && hasBatteryServiceAction) {
      ids.add('battery_replacement');
    }
    if (RegExp(r'wiper|windshield blade|washer blade').hasMatch(text)) {
      ids.add('wiper_replacement');
    }

    return ids.toSet().toList();
  }

  /// Mirrors getMileageCadence in packages/shared/src/vehicleHealth.js.
  static int _getMileageCadence(
    Vehicle vehicle,
    List<Maintenance> maintenance,
    DateTime now,
  ) {
    final currentMileage = vehicle.mileage;
    final points = <({int mileage, DateTime date})>[];

    for (final entry in maintenance) {
      final mileage = _parseMileage(entry.mileage);
      if (mileage <= 0) continue;
      points.add((mileage: mileage, date: entry.date));
    }
    points.sort((a, b) => a.date.compareTo(b.date));

    if (currentMileage > 0) {
      points.add((mileage: currentMileage, date: now));
    }

    if (points.length >= 2) {
      final first = points.first;
      final last = points.last;
      final mileageDelta = math.max(0, last.mileage - first.mileage);
      final dayDelta = math.max(30, _daysBetween(first.date, last.date));
      final monthly = ((mileageDelta / dayDelta) * 30).round();
      if (monthly > 0) {
        return _clampD(monthly.toDouble(), 200, 2500).round();
      }
    }

    final purchaseDateStr = vehicle.purchaseDate;
    if (purchaseDateStr != null && purchaseDateStr.isNotEmpty) {
      final purchaseDate = DateTime.tryParse(purchaseDateStr);
      if (purchaseDate != null &&
          currentMileage > 0 &&
          purchaseDate.isBefore(now)) {
        final ownershipDays = math.max(30, _daysBetween(purchaseDate, now));
        final monthly = ((currentMileage / ownershipDays) * 30).round();
        return _clampD(monthly.toDouble(), 200, 2500).round();
      }
    }

    return _defaultMonthlyMiles;
  }

  /// Mirrors buildAnchor in packages/shared/src/vehicleHealth.js, including
  /// the (0 vs null) mileage distinction: a matched record with no mileage
  /// leaves the mileage anchor unset (null), but the purchase-date fallback
  /// deliberately anchors mileage at 0 (assumes the component was serviced
  /// new at purchase), so both platforms treat an unserviced component the
  /// same way once a purchase date is known.
  static _Anchor _buildAnchor(
    String componentId,
    Vehicle vehicle,
    List<Maintenance> maintenance,
  ) {
    // Entries with a fabricated date (see Maintenance.hasKnownDate) sort as
    // if very old, mirroring the JS implementation's `new Date(entry.date ||
    // 0)` — otherwise a record with an unknown date would default to
    // DateTime.now() and wrongly win "most recent" against a genuinely
    // dated real record.
    final epoch = DateTime.fromMillisecondsSinceEpoch(0);
    final matching =
        maintenance
            .where((entry) => _inferComponentIds(entry).contains(componentId))
            .toList()
          ..sort((a, b) {
            final aDate = a.hasKnownDate ? a.date : epoch;
            final bDate = b.hasKnownDate ? b.date : epoch;
            return bDate.compareTo(aDate);
          });

    if (matching.isNotEmpty) {
      final entry = matching.first;
      final parsedMileage = _parseMileage(entry.mileage);
      return _Anchor(
        source: 'record',
        date: entry.hasKnownDate ? entry.date : null,
        mileage: parsedMileage > 0 ? parsedMileage : null,
        hasDate: entry.hasKnownDate,
        hasMileage: parsedMileage > 0,
      );
    }

    final purchaseDateStr = vehicle.purchaseDate;
    if (purchaseDateStr != null && purchaseDateStr.isNotEmpty) {
      final purchaseDate = DateTime.tryParse(purchaseDateStr);
      if (purchaseDate != null) {
        return _Anchor(
          source: 'default',
          date: purchaseDate,
          mileage: 0,
          hasDate: true,
          hasMileage: false,
        );
      }
    }

    return const _Anchor(
      source: 'default',
      date: null,
      mileage: null,
      hasDate: false,
      hasMileage: false,
    );
  }

  static String _confidenceBand(double score) {
    if (score >= 0.75) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
  }

  static String _statusFromPercent(double? percent) {
    final p = percent ?? 0.2;
    if (p <= 0) return 'overdue';
    if (p <= 0.15) return 'service soon';
    if (p <= 0.35) return 'watch';
    return 'good';
  }

  static VehicleHealthSnapshot buildSnapshot(
    Vehicle vehicle,
    List<Maintenance> maintenance, {
    DateTime? now,
  }) {
    final currentTime = now ?? DateTime.now();
    final currentMileage = vehicle.mileage;
    final milesPerMonth = _getMileageCadence(vehicle, maintenance, currentTime);
    final milesPerDay = math.max(1, (milesPerMonth / 30).round());

    final components = <VehicleHealthComponent>[];
    final confidenceScores = <double>[];

    for (final spec in _kComponents) {
      final anchor = _buildAnchor(spec.id, vehicle, maintenance);
      final elapsedMiles = anchor.mileage != null
          ? math.max(0, currentMileage - anchor.mileage!)
          : null;
      final elapsedDays = anchor.date != null
          ? _daysBetween(anchor.date!, currentTime)
          : null;

      int? remainingMiles;
      int? remainingDays;
      int? dueMileage;
      DateTime? dueDate;
      final percentCandidates = <double>[];

      if (spec.intervalMiles != null) {
        if (elapsedMiles != null) {
          remainingMiles = spec.intervalMiles! - elapsedMiles;
        } else if (currentMileage > 0) {
          final consumed = currentMileage % spec.intervalMiles!;
          remainingMiles = spec.intervalMiles! - consumed;
        }

        if (remainingMiles != null) {
          dueMileage = currentMileage + remainingMiles;
          percentCandidates.add(remainingMiles / spec.intervalMiles!);
        }
      }

      if (elapsedDays != null) {
        remainingDays = spec.intervalDays - elapsedDays;
      }

      if (remainingDays != null) {
        dueDate = _addDays(currentTime, remainingDays);
        percentCandidates.add(remainingDays / spec.intervalDays);
      } else if (remainingMiles != null) {
        final convertedDays = (remainingMiles / milesPerDay).round();
        remainingDays = convertedDays;
        dueDate = _addDays(currentTime, convertedDays);
      }

      final remainingPercent = percentCandidates.isNotEmpty
          ? _clampD(
              percentCandidates.reduce((a, b) => a < b ? a : b),
              -0.5,
              1.0,
            )
          : null;

      double confidenceScore = 0.35;
      if (anchor.source == 'record' && anchor.hasDate && anchor.hasMileage) {
        confidenceScore = 0.88;
      } else if (anchor.source == 'record' &&
          (anchor.hasDate || anchor.hasMileage)) {
        confidenceScore = 0.68;
      } else if (currentMileage > 0) {
        confidenceScore = 0.4;
      }
      if (milesPerMonth != _defaultMonthlyMiles) {
        confidenceScore = _clampD(confidenceScore + 0.05, 0, 0.95);
      }
      confidenceScores.add(confidenceScore);

      final status = _statusFromPercent(remainingPercent);

      components.add(
        VehicleHealthComponent(
          label: spec.label,
          status: status,
          confidence: _confidenceBand(confidenceScore),
          remainingPercent: remainingPercent,
          remainingMiles: remainingMiles,
          remainingDays: remainingDays,
          estimatedDueMileage: dueMileage,
          estimatedDueDate: dueDate,
          costLow: spec.costLow,
          costHigh: spec.costHigh,
        ),
      );
    }

    // Overdue severity is reflected once, by letting remainingPercent go
    // negative (down to its own -0.5 floor) in the average — not by also
    // subtracting a flat per-item penalty on top, which previously
    // double-counted overdue/soon items and bottomed every
    // heavily-neglected vehicle out at the same floor score regardless of
    // how overdue it actually was.
    final weightedPercent = components.fold<double>(
      0,
      (sum, component) =>
          sum + (component.remainingPercent ?? 0.4).clamp(-0.5, 1),
    );
    var overallHealthScore = ((weightedPercent / components.length) * 100)
        .round();
    overallHealthScore = overallHealthScore.clamp(0, 100);

    final overallConfidenceScore =
        confidenceScores.reduce((a, b) => a + b) / confidenceScores.length;
    final overallConfidenceBand = _confidenceBand(overallConfidenceScore);

    final rankedByUrgency = [...components]
      ..sort((a, b) {
        const infinity = 1 << 30;
        final aDays = a.remainingDays ?? infinity;
        final bDays = b.remainingDays ?? infinity;
        if (aDays != bDays) return aDays.compareTo(bDays);
        final aMiles = a.remainingMiles ?? infinity;
        final bMiles = b.remainingMiles ?? infinity;
        return aMiles.compareTo(bMiles);
      });

    final specByLabel = {for (final spec in _kComponents) spec.label: spec};

    // Recurring items (oil, rotation, wipers) recur multiple times within a
    // long window — a 36-month oil forecast should price in ~6 changes, not
    // 1.
    ({int low, int high}) spendInWindow(int months) {
      final horizonDays = months * 30;
      final horizonMiles = milesPerMonth * months;
      var low = 0;
      var high = 0;
      for (final component in rankedByUrgency) {
        final spec = specByLabel[component.label];
        final occurrences = countOccurrencesInWindow(
          remainingDays: component.remainingDays,
          intervalDays: spec?.intervalDays,
          remainingMiles: component.remainingMiles,
          intervalMiles: spec?.intervalMiles,
          horizonDays: horizonDays,
          horizonMiles: horizonMiles,
        );
        if (occurrences == 0) continue;
        low += component.costLow * occurrences;
        high += component.costHigh * occurrences;
      }
      return (low: low, high: high);
    }

    final spend90d = spendInWindow(3);
    final spend12m = spendInWindow(12);
    final spend36m = spendInWindow(36);

    final lowConfidenceCount = components
        .where((component) => component.confidence == 'low')
        .length;
    final missingServiceHistory = maintenance.isEmpty;

    final accuracyTip = missingServiceHistory
        ? 'Add your recent service entries to improve forecast accuracy.'
        : 'Keep mileage and service entries current so remaining-life estimates stay accurate.';

    return VehicleHealthSnapshot(
      vin: vehicle.vin,
      vehicleLabel: '${vehicle.year} ${vehicle.make} ${vehicle.model}',
      overallHealthScore: overallHealthScore,
      accuracyTip: accuracyTip,
      components: rankedByUrgency,
      nextLikelyService: rankedByUrgency.isNotEmpty
          ? rankedByUrgency.first.label
          : null,
      estimatedMilesPerMonth: milesPerMonth,
      estimatedSpend90dLow: spend90d.low,
      estimatedSpend90dHigh: spend90d.high,
      estimatedSpend12mLow: spend12m.low,
      estimatedSpend12mHigh: spend12m.high,
      estimatedSpend36mLow: spend36m.low,
      estimatedSpend36mHigh: spend36m.high,
      missingServiceHistory: missingServiceHistory,
      lowConfidenceCount: lowConfidenceCount,
      overallConfidenceScore: overallConfidenceScore,
      overallConfidenceBand: overallConfidenceBand,
    );
  }

  static int _serverInt(dynamic value, [int fallback = 0]) {
    if (value is int) return value;
    if (value is num) return value.round();
    return fallback;
  }

  static double _serverDouble(dynamic value, [double fallback = 0]) {
    if (value is num) return value.toDouble();
    return fallback;
  }

  /// Parses a server-precomputed snapshot (see
  /// packages/functions/src/vehicleHealth.provider.ts, which calls the
  /// same computeVehicleHealthSnapshot algorithm this file otherwise
  /// hand-ports) into the same VehicleHealthSnapshot shape buildSnapshot
  /// produces, so callers don't need to know which source it came from.
  /// Status strings are normalized (service_soon -> service soon) since
  /// the server mirrors packages/shared/src/vehicleHealth.js's
  /// underscore-separated status values.
  static VehicleHealthSnapshot _fromServerMap(
    Map<String, dynamic> map,
    Vehicle vehicle,
  ) {
    final rawComponents = (map['components'] as List?) ?? [];
    final components = rawComponents.map((raw) {
      final c = Map<String, dynamic>.from(raw as Map);
      final confidenceScore = _serverDouble(c['confidenceScore'], 0.35);
      final dueDateRaw = c['estimatedDueDate'];
      return VehicleHealthComponent(
        label: (c['label'] ?? '').toString(),
        status: (c['status'] ?? 'good').toString().replaceAll('_', ' '),
        confidence: _confidenceBand(confidenceScore),
        remainingPercent: c['remainingLifePercent'] is num
            ? (c['remainingLifePercent'] as num).toDouble()
            : null,
        remainingMiles: c['remainingMiles'] is num
            ? (c['remainingMiles'] as num).round()
            : null,
        remainingDays: c['remainingDays'] is num
            ? (c['remainingDays'] as num).round()
            : null,
        estimatedDueMileage: c['estimatedDueMileage'] is num
            ? (c['estimatedDueMileage'] as num).round()
            : null,
        estimatedDueDate: dueDateRaw is String
            ? DateTime.tryParse(dueDateRaw)
            : null,
        costLow: _serverInt(c['estimatedCostLow']),
        costHigh: _serverInt(c['estimatedCostHigh']),
      );
    }).toList();

    final overallConfidenceScore = _serverDouble(
      map['overallConfidenceScore'],
      0.35,
    );

    return VehicleHealthSnapshot(
      vin: (map['vin'] ?? vehicle.vin).toString(),
      vehicleLabel: '${vehicle.year} ${vehicle.make} ${vehicle.model}',
      overallHealthScore: _serverInt(map['overallHealthScore'], 50),
      accuracyTip: (map['accuracyTip'] ?? '').toString(),
      components: components,
      nextLikelyService: map['nextLikelyService']?.toString(),
      estimatedMilesPerMonth: _serverInt(map['estimatedMilesPerMonth'], 900),
      estimatedSpend90dLow: _serverInt(map['estimatedSpend90dLow']),
      estimatedSpend90dHigh: _serverInt(map['estimatedSpend90dHigh']),
      estimatedSpend12mLow: _serverInt(map['estimatedSpend12mLow']),
      estimatedSpend12mHigh: _serverInt(map['estimatedSpend12mHigh']),
      estimatedSpend36mLow: _serverInt(map['estimatedSpend36mLow']),
      estimatedSpend36mHigh: _serverInt(map['estimatedSpend36mHigh']),
      missingServiceHistory: map['missingServiceHistory'] == true,
      lowConfidenceCount: _serverInt(map['lowConfidenceCount']),
      overallConfidenceScore: overallConfidenceScore,
      overallConfidenceBand: _confidenceBand(overallConfidenceScore),
    );
  }

  /// Reads the server-precomputed snapshot when it exists and is fresh
  /// relative to the vehicle's current mileage/maintenance-entry count,
  /// falling back to buildSnapshot (the same computation, run locally) —
  /// mirrors packages/web/src/utils/vehicleHealthSnapshot.ts's
  /// resolveVehicleHealthSnapshot. A missing, stale, or malformed
  /// snapshot degrades to today's always-worked local computation rather
  /// than showing wrong or missing data, which also covers a brand-new
  /// vehicle whose first trigger run hasn't landed yet and an offline
  /// edit that hasn't synced.
  static VehicleHealthSnapshot resolveSnapshot(
    Vehicle vehicle,
    List<Maintenance> maintenance, {
    DateTime? now,
  }) {
    final versionKey = '${vehicle.mileage}:${maintenance.length}';
    final raw = vehicle.vehicleHealthSnapshot;
    if (raw != null &&
        raw['computedFromVersion'] == versionKey &&
        raw['components'] is List) {
      try {
        return _fromServerMap(raw, vehicle);
      } catch (_) {
        // Malformed server data — fall through to local computation.
      }
    }
    return buildSnapshot(vehicle, maintenance, now: now);
  }
}
