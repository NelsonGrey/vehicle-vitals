import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../components/app_bottom_nav.dart';
import '../components/vehicle_health_widgets.dart';
import '../models/maintenance.dart';
import '../models/maintenance_schedule.dart';
import '../models/vehicle.dart';
import '../models/vehicle_health.dart';
import '../services/firestore_service.dart';
import '../services/premium_service.dart';
import '../theme/design_tokens.dart';

const bool _screenshotMode = bool.fromEnvironment('VV_SCREENSHOT_MODE');

class VehicleDetailScreen extends StatefulWidget {
  final String vin;

  const VehicleDetailScreen({super.key, required this.vin});

  @override
  State<VehicleDetailScreen> createState() => _VehicleDetailScreenState();
}

class _VehicleDetailScreenState extends State<VehicleDetailScreen> {
  bool _loading = true;
  String? _error;
  Vehicle? _vehicle;
  VehicleHealthSnapshot? _healthSnapshot;

  @override
  void initState() {
    super.initState();
    _loadVehicle();
  }

  Future<void> _loadVehicle() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final firestoreService = FirestoreService();
      final results = await Future.wait([
        firestoreService.getVehicle(widget.vin),
        firestoreService.getMaintenanceEntries(widget.vin),
      ]);
      final vehicle = results[0] as Vehicle?;
      final entries = results[1] as List<Maintenance>;
      if (!mounted) return;
      setState(() {
        _vehicle = vehicle;
        _healthSnapshot = vehicle == null
            ? null
            : VehicleHealthCalculator.buildSnapshot(vehicle, entries);
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  bool _isStored(Vehicle vehicle) => vehicle.vehicleStatus == 'stored';

  String _statusLabel(Vehicle vehicle) =>
      _isStored(vehicle) ? 'Stored' : 'In Garage';

  Future<void> _openAttributionUrl(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null) {
      return;
    }

    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Widget _buildVehicleThumbnail({
    required Vehicle vehicle,
    double width = 120,
  }) {
    final imageUrl = (vehicle.photoUrl ?? '').trim();
    if (imageUrl.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: CachedNetworkImage(
          imageUrl: imageUrl,
          width: width,
          height: 52,
          fit: BoxFit.cover,
          placeholder: (context, url) => Container(
            width: width,
            height: 52,
            color: Colors.grey.shade200,
            child: const Icon(Icons.directions_car, size: 20),
          ),
          errorWidget: (context, url, error) => Container(
            width: width,
            height: 52,
            color: Colors.grey.shade200,
            child: const Icon(Icons.directions_car, size: 20),
          ),
        ),
      );
    }

    return Container(
      width: width,
      height: 52,
      decoration: BoxDecoration(
        color: Colors.grey.shade200,
        borderRadius: BorderRadius.circular(8),
      ),
      child: const Icon(Icons.directions_car, size: 20),
    );
  }

  Widget _buildHealthSection(BuildContext context, ColorScheme colorScheme) {
    final snapshot = _healthSnapshot;
    final vehicle = _vehicle;
    if (snapshot == null || vehicle == null) return const SizedBox.shrink();

    final tier = context.watch<PremiumService>().subscriptionTier;
    final visibleComponents = tier == 'free'
        ? snapshot.components.take(3).toList()
        : snapshot.components;
    final hiddenCount = snapshot.components.length - visibleComponents.length;

    final requiredTotal = vehicle.requiredPortfolioItemCount;
    final requiredComplete = vehicle.completedRequiredPortfolioItemCount;
    final optionalTotal = vehicle.optionalPortfolioItemCount;
    final optionalComplete = vehicle.completedOptionalPortfolioItemCount;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        const SizedBox(height: 12),
        const Divider(),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Vehicle Health',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            HealthScoreBadge(score: snapshot.overallHealthScore),
          ],
        ),
        const SizedBox(height: 10),
        // Record Completeness — folded into Health (not a separate score)
        // so it reads as "why the forecast confidence is what it is"
        // rather than a second, competing garage metric. Mirrors the same
        // merge on packages/web's VehicleHealthPanel.
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            border: Border.all(color: colorScheme.outlineVariant),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'RECORD COMPLETENESS',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.5,
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                requiredTotal > 0
                    ? '$requiredComplete/$requiredTotal required'
                    : 'No required records yet',
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
              ),
              if (requiredTotal > 0) ...[
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: requiredComplete / requiredTotal,
                    minHeight: 6,
                    backgroundColor: colorScheme.surfaceContainerHighest,
                    color: AppDesignTokens.success,
                  ),
                ),
              ],
              if (optionalTotal > 0) ...[
                const SizedBox(height: 6),
                Text(
                  '+$optionalComplete/$optionalTotal optional records added',
                  style: TextStyle(
                    fontSize: 12,
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
              const SizedBox(height: 8),
              Text(
                snapshot.accuracyTip,
                style: TextStyle(
                  fontSize: 13,
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Required records (title, insurance, registration, etc.) '
                "are what this forecast is based on — optional records add "
                "extra detail but aren't scored.",
                style: TextStyle(fontSize: 11, color: colorScheme.outline),
              ),
              const SizedBox(height: 8),
              InkWell(
                onTap: () => context.push('/app/records/${vehicle.vin}'),
                child: Text(
                  'View records →',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: colorScheme.primary,
                  ),
                ),
              ),
            ],
          ),
        ),
        if (snapshot.nextLikelyService != null) ...[
          const SizedBox(height: 6),
          Text(
            'Next likely service: ${snapshot.nextLikelyService}',
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
          ),
        ],
        const SizedBox(height: 4),
        Text(
          'Estimated 12-month spend: \$${snapshot.estimatedSpend12mLow}-\$${snapshot.estimatedSpend12mHigh}',
          style: TextStyle(fontSize: 12, color: colorScheme.onSurfaceVariant),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: visibleComponents
              .map((component) => HealthComponentCard(component: component))
              .toList(),
        ),
        if (hiddenCount > 0) ...[
          const SizedBox(height: 8),
          Text(
            'Upgrade to see $hiddenCount more forecast${hiddenCount == 1 ? '' : 's'}.',
            style: TextStyle(fontSize: 12, color: colorScheme.tertiary),
          ),
        ],
      ],
    );
  }

  Widget _buildMaintenanceSection(
    BuildContext context,
    Vehicle vehicle,
    ColorScheme colorScheme,
  ) {
    final items = MaintenanceSchedule.getUpcomingMaintenance(
      vehicle.make,
      vehicle.model,
      vehicle.mileage,
      vehicle.mileage + 10000,
    ).take(3).toList();
    if (items.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        const SizedBox(height: 10),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Upcoming Maintenance',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
            ),
            GestureDetector(
              onTap: () => context.push('/app/upcoming'),
              child: Text(
                'View all →',
                style: TextStyle(fontSize: 12, color: colorScheme.primary),
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ...items.map((item) {
          final miles = item['milesUntilDue'] as int;
          final isUrgent = miles <= 1000;
          final isSoon = miles <= 5000;
          final dotColor = isUrgent
              ? colorScheme.error
              : isSoon
              ? colorScheme.tertiary
              : Colors.grey.shade400;
          final labelColor = isUrgent
              ? colorScheme.error
              : isSoon
              ? colorScheme.tertiary
              : Colors.grey.shade600;
          return Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  margin: const EdgeInsets.only(right: 8),
                  decoration: BoxDecoration(
                    color: dotColor,
                    shape: BoxShape.circle,
                  ),
                ),
                Expanded(
                  child: Text(
                    item['description'] as String,
                    style: const TextStyle(fontSize: 12),
                  ),
                ),
                Text(
                  miles <= 0 ? 'Due now' : '$miles mi',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: labelColor,
                  ),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Vehicle')),
        body: const Center(child: CircularProgressIndicator()),
        bottomNavigationBar: const AppBottomNav(currentIndex: 0),
      );
    }

    if (_error != null || _vehicle == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Vehicle')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.error_outline, color: colorScheme.error, size: 40),
                const SizedBox(height: 12),
                Text(
                  _error != null
                      ? 'Unable to load vehicle: $_error'
                      : 'Vehicle not found.',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: _loadVehicle,
                  child: const Text('Try again'),
                ),
              ],
            ),
          ),
        ),
        bottomNavigationBar: const AppBottomNav(currentIndex: 0),
      );
    }

    final vehicle = _vehicle!;

    return Scaffold(
      appBar: AppBar(
        title: Text('${vehicle.year} ${vehicle.make} ${vehicle.model}'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildVehicleThumbnail(vehicle: vehicle, width: 120),
            const SizedBox(height: 10),
            Text(
              '${vehicle.year} ${vehicle.make} ${vehicle.model}',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 4),
            Text('VIN: ${vehicle.vin}'),
            const SizedBox(height: 4),
            Text('Mileage: ${vehicle.mileage} miles'),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: _isStored(vehicle)
                    ? colorScheme.surfaceContainerHighest
                    : colorScheme.primary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(99),
              ),
              child: Text(
                _statusLabel(vehicle),
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            if (vehicle.photoSource == 'wikimedia' &&
                (vehicle.photoAttributionUrl ?? '').isNotEmpty) ...[
              const SizedBox(height: 4),
              GestureDetector(
                onTap: () =>
                    _openAttributionUrl(vehicle.photoAttributionUrl ?? ''),
                child: Text(
                  'Image source: Wikimedia (view source)',
                  style: TextStyle(
                    fontSize: 12,
                    color: colorScheme.primary,
                    decoration: TextDecoration.underline,
                  ),
                ),
              ),
            ],
            const SizedBox(height: 8),
            if (vehicle.recallsCount > 0)
              Text(
                'Open recalls: ${vehicle.recallsCount}',
                style: TextStyle(
                  color: colorScheme.secondary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            _buildHealthSection(context, colorScheme),
            _buildMaintenanceSection(context, vehicle, colorScheme),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () =>
                        context.push('/app/edit-vehicle/${vehicle.vin}'),
                    icon: const Icon(Icons.edit, size: 16),
                    label: const Text('Edit'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () =>
                        context.push('/app/records/${vehicle.vin}'),
                    icon: const Icon(Icons.folder_open, size: 16),
                    label: const Text('Records'),
                  ),
                ),
              ],
            ),
            if (!_screenshotMode) ...[
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () =>
                      context.push('/app/maintenance/${vehicle.vin}'),
                  icon: const Icon(Icons.build, size: 16),
                  label: const Text('Maintenance'),
                ),
              ),
            ],
          ],
        ),
      ),
      bottomNavigationBar: const AppBottomNav(currentIndex: 0),
    );
  }
}
