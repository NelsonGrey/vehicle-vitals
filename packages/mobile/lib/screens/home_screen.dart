import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../components/app_bottom_nav.dart';
import '../components/app_logo.dart';
import '../components/vehicle_health_widgets.dart';
import '../models/maintenance.dart';
import '../models/vehicle.dart';
import '../models/vehicle_health.dart';
import '../services/auth_service.dart';
import '../services/firestore_service.dart';
import '../services/maintenance_plan_service.dart';
import '../services/premium_service.dart';
import '../theme/design_tokens.dart';

/// Cap on how many vehicles get a fetched health badge per Home load. Health
/// data is a "reasonable effort" feature on the garage list: large
/// enterprise-tier garages (up to 250 vehicles) shouldn't trigger hundreds of
/// parallel maintenance-entry fetches just to render the list.
const int _kMaxHealthBadgeFetches = 50;

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String _searchTerm = '';
  final _firestoreService = FirestoreService();
  final MaintenancePlanService _maintenancePlanService =
      MaintenancePlanService();
  final Map<String, List<Maintenance>> _maintenanceEntriesByVin = {};
  final Set<String> _fetchingVins = {};
  final Map<String, MaintenancePlan> _maintenancePlanByVin = {};
  final Set<String> _fetchingPlanVins = {};

  Future<void> _ensureHealthDataFor(List<Vehicle> vehicles) async {
    final missing = vehicles
        .take(_kMaxHealthBadgeFetches)
        .map((vehicle) => vehicle.vin)
        .where(
          (vin) =>
              !_maintenanceEntriesByVin.containsKey(vin) &&
              !_fetchingVins.contains(vin),
        )
        .toList();
    if (missing.isEmpty) return;

    _fetchingVins.addAll(missing);
    final results = await Future.wait(
      missing.map((vin) => _firestoreService.getMaintenanceEntries(vin)),
    );
    if (!mounted) return;
    setState(() {
      for (var i = 0; i < missing.length; i++) {
        _maintenanceEntriesByVin[missing[i]] = results[i];
        _fetchingVins.remove(missing[i]);
      }
    });
  }

  Future<void> _ensureMaintenancePlansFor(List<Vehicle> vehicles) async {
    final missing = vehicles
        .take(_kMaxHealthBadgeFetches)
        .where(
          (vehicle) =>
              vehicle.mileage > 0 &&
              !_maintenancePlanByVin.containsKey(vehicle.vin) &&
              !_fetchingPlanVins.contains(vehicle.vin),
        )
        .toList();
    if (missing.isEmpty) return;

    _fetchingPlanVins.addAll(missing.map((vehicle) => vehicle.vin));
    final results = await Future.wait(
      missing.map(
        (vehicle) => _maintenancePlanService
            .getMaintenancePlan(
              vin: vehicle.vin,
              currentMileage: vehicle.mileage,
              make: vehicle.make,
              model: vehicle.model,
            )
            .catchError(
              (_) =>
                  const MaintenancePlan(modelSpecific: false, items: []),
            ),
      ),
    );
    if (!mounted) return;
    setState(() {
      for (var i = 0; i < missing.length; i++) {
        _maintenancePlanByVin[missing[i].vin] = results[i];
        _fetchingPlanVins.remove(missing[i].vin);
      }
    });
  }

  VehicleHealthSnapshot? _healthSnapshotFor(Vehicle vehicle) {
    final entries = _maintenanceEntriesByVin[vehicle.vin];
    if (entries == null) return null;
    return VehicleHealthCalculator.resolveSnapshot(vehicle, entries);
  }

  bool _isStored(Vehicle vehicle) => vehicle.vehicleStatus == 'stored';

  String _statusLabel(Vehicle vehicle) =>
      _isStored(vehicle) ? 'Stored' : 'In Garage';

  void _handleAddVehicleTap({
    required int currentVehicleCount,
    required int vehicleLimit,
    required String tier,
  }) {
    if (currentVehicleCount < vehicleLimit) {
      context.push('/app/add-vehicle');
      return;
    }

    final colorScheme = Theme.of(context).colorScheme;
    final isPremiumLike = tier == 'premium' || tier == 'enterprise';
    final message = isPremiumLike
        ? 'Your current subscription has reached the vehicle limit. Visit Support for Enterprise expansion.'
        : 'Vehicle limit reached for your current subscription. Upgrade to add more vehicles.';

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: colorScheme.secondary),
    );

    if (isPremiumLike) {
      context.push('/app/support');
    } else {
      context.push('/app/premium');
    }
  }

  Widget? _maintenanceUrgencyChip(Vehicle vehicle, ColorScheme colorScheme) {
    final plan = _maintenancePlanByVin[vehicle.vin];
    if (plan == null) return null;
    final dueSoon =
        plan.items
            .where((item) => item.nextDueMileage - vehicle.mileage <= 10000)
            .toList()
          ..sort(
            (a, b) => a.nextDueMileage.compareTo(b.nextDueMileage),
          );
    if (dueSoon.isEmpty) return null;
    final miles = (dueSoon.first.nextDueMileage - vehicle.mileage).clamp(
      0,
      1 << 30,
    );
    if (miles > 5000) return null;
    final isUrgent = miles <= 1000;
    final urgencyColor = isUrgent ? colorScheme.error : colorScheme.tertiary;
    return Container(
      margin: const EdgeInsets.only(top: 4),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: urgencyColor.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(99),
      ),
      child: Text(
        isUrgent ? '⚠ Maintenance due!' : 'Service due soon',
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: urgencyColor,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context);
    final premiumService = Provider.of<PremiumService>(context);
    final firestoreService = FirestoreService();
    final colorScheme = Theme.of(context).colorScheme;

    if (authService.currentUser == null) {
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const AppLogo(size: 64, compact: false, showText: true),
                const SizedBox(height: 16),
                Text(
                  'Track your vehicles, log maintenance, and stay on schedule.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppDesignTokens.colorScheme(
                      Theme.of(context).brightness,
                    ).muted,
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    ElevatedButton(
                      onPressed: () => context.go('/auth/login'),
                      child: const Text('Log in'),
                    ),
                    const SizedBox(width: 12),
                    ElevatedButton(
                      onPressed: () => context.go('/auth/signup'),
                      child: const Text('Sign up'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Garage')),
      body: StreamBuilder<List<Vehicle>>(
        stream: firestoreService.getVehiclesStream(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          final vehicles = snapshot.data ?? [];
          final vehicleLimit = premiumService.vehicleLimit;
          final currentTier = premiumService.subscriptionTier;
          final filtered = vehicles.where((vehicle) {
            final q = _searchTerm.toLowerCase();
            return vehicle.vin.toLowerCase().contains(q) ||
                vehicle.make.toLowerCase().contains(q) ||
                vehicle.model.toLowerCase().contains(q) ||
                vehicle.year.toString().contains(q);
          }).toList();
          final activeVehicles = filtered
              .where((vehicle) => !_isStored(vehicle))
              .toList();
          final storedVehicles = filtered
              .where((vehicle) => _isStored(vehicle))
              .toList();

          WidgetsBinding.instance.addPostFrameCallback((_) {
            _ensureHealthDataFor(filtered);
            _ensureMaintenancePlansFor(filtered);
          });

          final healthSnapshots = filtered
              .map(_healthSnapshotFor)
              .whereType<VehicleHealthSnapshot>()
              .toList();
          final attentionCount = healthSnapshots
              .where((snapshot) => snapshot.overallHealthScore < 80)
              .length;

          return Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (healthSnapshots.isNotEmpty) ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color:
                          (attentionCount > 0
                                  ? colorScheme.tertiary
                                  : AppDesignTokens.success)
                              .withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.monitor_heart,
                          size: 16,
                          color: attentionCount > 0
                              ? colorScheme.tertiary
                              : AppDesignTokens.success,
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                attentionCount > 0
                                    ? 'Garage Health: $attentionCount of ${healthSnapshots.length} vehicle${healthSnapshots.length == 1 ? '' : 's'} may need attention'
                                    : 'Garage Health: all ${healthSnapshots.length} vehicle${healthSnapshots.length == 1 ? '' : 's'} looking good',
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: attentionCount > 0
                                      ? colorScheme.tertiary
                                      : AppDesignTokens.success,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Estimates remaining life on key maintenance '
                                'items (oil, brakes, tires, fluids) from '
                                'mileage and logged service history — a '
                                'vehicle needs attention below a score of '
                                '80. Log services to keep this accurate.',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: colorScheme.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        decoration: const InputDecoration(
                          hintText: 'Search VIN, make, model, year',
                          prefixIcon: Icon(Icons.search),
                          border: OutlineInputBorder(),
                        ),
                        onChanged: (value) {
                          setState(() {
                            _searchTerm = value;
                          });
                        },
                      ),
                    ),
                    const SizedBox(width: 10),
                    ElevatedButton.icon(
                      onPressed: () => _handleAddVehicleTap(
                        currentVehicleCount: vehicles.length,
                        vehicleLimit: vehicleLimit,
                        tier: currentTier,
                      ),
                      icon: const Icon(Icons.add),
                      label: Text(
                        vehicles.length >= vehicleLimit
                            ? 'Limit Reached'
                            : 'Add',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  '${activeVehicles.length} active • ${storedVehicles.length} stored',
                  style: TextStyle(color: colorScheme.onSurfaceVariant),
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: filtered.isEmpty
                      ? const Center(
                          child: Text('No vehicles match this filter.'),
                        )
                      : ListView(
                          children: [
                            for (final section in [
                              ('Active Garage', activeVehicles),
                              ('Storage', storedVehicles),
                            ]) ...[
                              Padding(
                                padding: const EdgeInsets.only(
                                  bottom: 8,
                                  top: 4,
                                ),
                                child: Text(
                                  section.$1,
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: colorScheme.onSurfaceVariant,
                                  ),
                                ),
                              ),
                              if (section.$2.isEmpty)
                                Container(
                                  margin: const EdgeInsets.only(bottom: 8),
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    border: Border.all(
                                      color: colorScheme.outline,
                                    ),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Text(
                                    section.$1 == 'Storage'
                                        ? 'No stored vehicles match this filter.'
                                        : 'No active vehicles match this filter.',
                                  ),
                                ),
                              for (final vehicle in section.$2)
                                Container(
                                  margin: const EdgeInsets.only(bottom: 8),
                                  decoration: BoxDecoration(
                                    color: colorScheme.surface,
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(
                                      color: colorScheme.outline,
                                    ),
                                  ),
                                  child: ListTile(
                                    onTap: () => context.push(
                                      '/app/vehicle/${vehicle.vin}',
                                    ),
                                    leading: CircleAvatar(
                                      backgroundColor: Colors.grey.shade200,
                                      backgroundImage:
                                          (vehicle.photoUrl ?? '')
                                              .trim()
                                              .isNotEmpty
                                          ? NetworkImage(vehicle.photoUrl!)
                                          : null,
                                      child:
                                          (vehicle.photoUrl ?? '')
                                              .trim()
                                              .isEmpty
                                          ? const Icon(Icons.directions_car)
                                          : null,
                                    ),
                                    title: Text(
                                      '${vehicle.year} ${vehicle.make} ${vehicle.model}',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    subtitle: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text(
                                          'VIN: ${vehicle.vin}',
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        Text(_statusLabel(vehicle)),
                                        Builder(
                                          builder: (ctx) {
                                            final chip =
                                                _maintenanceUrgencyChip(
                                                  vehicle,
                                                  colorScheme,
                                                );
                                            return chip ??
                                                const SizedBox.shrink();
                                          },
                                        ),
                                      ],
                                    ),
                                    trailing: Column(
                                      mainAxisSize: MainAxisSize.min,
                                      crossAxisAlignment:
                                          CrossAxisAlignment.end,
                                      children: [
                                        Builder(
                                          builder: (ctx) {
                                            final snapshot = _healthSnapshotFor(
                                              vehicle,
                                            );
                                            return snapshot == null
                                                ? const SizedBox.shrink()
                                                : HealthScoreBadge(
                                                    score: snapshot
                                                        .overallHealthScore,
                                                    compact: true,
                                                  );
                                          },
                                        ),
                                        if (vehicle.recallsCount > 0) ...[
                                          const SizedBox(height: 4),
                                          Container(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 8,
                                              vertical: 4,
                                            ),
                                            decoration: BoxDecoration(
                                              color: colorScheme.secondary
                                                  .withValues(alpha: 0.18),
                                              borderRadius:
                                                  BorderRadius.circular(99),
                                            ),
                                            child: Text(
                                              '${vehicle.recallsCount} recalls',
                                              style: const TextStyle(
                                                fontSize: 12,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                ),
                            ],
                          ],
                        ),
                ),
              ],
            ),
          );
        },
      ),
      bottomNavigationBar: const AppBottomNav(currentIndex: 0),
    );
  }
}
