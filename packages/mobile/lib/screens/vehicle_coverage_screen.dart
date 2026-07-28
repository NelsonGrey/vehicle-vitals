import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../components/app_bottom_nav.dart';
import '../models/vehicle.dart';
import '../services/firestore_service.dart';
import '../services/manuals_service.dart';
import '../services/warranty_service.dart';
import '../utils/user_facing_error.dart';

class VehicleCoverageScreen extends StatefulWidget {
  final String vin;

  const VehicleCoverageScreen({super.key, required this.vin});

  @override
  State<VehicleCoverageScreen> createState() => _VehicleCoverageScreenState();
}

class _VehicleCoverageScreenState extends State<VehicleCoverageScreen> {
  final WarrantyService _warrantyService = WarrantyService();
  final ManualsService _manualsService = ManualsService();

  Vehicle? _vehicle;
  WarrantySummary? _warranty;
  List<OwnerManualDocument> _manuals = const [];
  bool _loading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    try {
      final firestoreService = context.read<FirestoreService>();
      final vehicle = await firestoreService.getVehicle(widget.vin);
      if (vehicle == null) {
        if (!mounted) return;
        setState(() {
          _loading = false;
          _errorMessage = 'Vehicle not found.';
        });
        return;
      }

      final results = await Future.wait([
        _warrantyService.getWarrantySummary(
          vin: vehicle.vin,
          currentMileage: vehicle.mileage > 0 ? vehicle.mileage : null,
        ),
        _manualsService.getOwnerManuals(vin: vehicle.vin),
      ]);

      if (!mounted) return;
      setState(() {
        _vehicle = vehicle;
        _warranty = results[0] as WarrantySummary;
        _manuals = results[1] as List<OwnerManualDocument>;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _errorMessage = userFacingError(
          e,
          fallback: 'Coverage and manuals could not be loaded.',
        );
      });
    }
  }

  Future<void> _openManual(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null) return;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Coverage & Manuals')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
          ? Padding(
              padding: const EdgeInsets.all(24),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      _errorMessage!,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.error,
                      ),
                    ),
                    const SizedBox(height: 16),
                    OutlinedButton(
                      onPressed: _load,
                      child: const Text('Try Again'),
                    ),
                  ],
                ),
              ),
            )
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  if (_vehicle != null) ...[
                    Text(
                      '${_vehicle!.year} ${_vehicle!.make} ${_vehicle!.model}',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 16),
                  ],
                  if (_warranty != null) _WarrantyCard(warranty: _warranty!),
                  const SizedBox(height: 16),
                  _ManualsCard(manuals: _manuals, onOpen: _openManual),
                ],
              ),
            ),
      bottomNavigationBar: const AppBottomNav(currentIndex: 0),
    );
  }
}

class _WarrantyCard extends StatelessWidget {
  const _WarrantyCard({required this.warranty});

  final WarrantySummary warranty;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isActive = warranty.status == 'active';

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Warranty Coverage',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: (isActive ? colorScheme.primary : colorScheme.error)
                        .withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    isActive ? 'Active' : 'Expired',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: isActive ? colorScheme.primary : colorScheme.error,
                    ),
                  ),
                ),
              ],
            ),
            if (!warranty.brandSpecific) ...[
              const SizedBox(height: 8),
              Text(
                'No manufacturer data on file for this make — showing a generic estimate.',
                style: TextStyle(
                  fontSize: 12,
                  fontStyle: FontStyle.italic,
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
            ],
            const SizedBox(height: 12),
            ...warranty.coverages.map(
              (coverage) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            formatCoverageTypeLabel(coverage.type),
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                        ),
                        Text(
                          coverage.maxMileage != null
                              ? '${coverage.maxMileage} mi cap'
                              : 'Unlimited miles',
                          style: TextStyle(
                            fontSize: 12,
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${coverage.startDate} to ${coverage.endDate}'
                      '${coverage.remainingMileage != null ? ' • ${coverage.remainingMileage} mi remaining' : ''}',
                      style: TextStyle(
                        fontSize: 12,
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                    if (coverage.note != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        coverage.note!,
                        style: TextStyle(
                          fontSize: 11,
                          fontStyle: FontStyle.italic,
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const Divider(height: 24),
            Text(
              warranty.notes,
              style: TextStyle(fontSize: 11, color: colorScheme.outline),
            ),
          ],
        ),
      ),
    );
  }
}

class _ManualsCard extends StatelessWidget {
  const _ManualsCard({required this.manuals, required this.onOpen});

  final List<OwnerManualDocument> manuals;
  final void Function(String url) onOpen;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "Owner's Manual",
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            if (manuals.isEmpty)
              Text(
                'No owner manual link is available for this vehicle yet.',
                style: TextStyle(
                  fontStyle: FontStyle.italic,
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              )
            else
              ...manuals.map(
                (manual) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.menu_book_outlined),
                  title: Text(manual.title),
                  subtitle: const Text('Opens the manufacturer\'s official site'),
                  trailing: const Icon(Icons.open_in_new, size: 18),
                  onTap: () => onOpen(manual.url),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
