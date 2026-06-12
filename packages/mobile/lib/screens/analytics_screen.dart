import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/maintenance.dart';
import '../models/vehicle_health.dart';
import '../models/vehicle.dart';
import '../services/auth_service.dart';
import '../services/firestore_service.dart';

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  Map<String, dynamic> _analyticsInsights = {};
  Map<String, dynamic> _maintenanceInsights = {};
  List<VehicleHealthSnapshot> _healthSnapshots = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadInsights();
  }

  Future<void> _loadInsights() async {
    setState(() => _isLoading = true);

    try {
      final analyticsService = context.read<AnalyticsService>();
      final firestoreService = context.read<FirestoreService>();
      final authService = context.read<AuthService>();
      final analyticsData = await analyticsService.getAnalyticsInsights();
      final maintenanceData = await analyticsService.getMaintenanceInsights();
      final vehicles = await firestoreService.getVehicles();

      final snapshots = <VehicleHealthSnapshot>[];
      for (final vehicle in vehicles.take(3)) {
        final entries = await firestoreService.getMaintenanceEntries(vehicle.vin);
        snapshots.add(
          VehicleHealthCalculator.buildSnapshot(vehicle, entries),
        );
      }

      if (authService.currentUser == null) {
        snapshots.clear();
      }

      setState(() {
        _analyticsInsights = analyticsData;
        _maintenanceInsights = maintenanceData;
        _healthSnapshots = snapshots;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load vehicle health: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Vehicle Health')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Vehicle Health'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadInsights,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Forecast dashboard',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Estimated remaining life is based on mileage and stored service history. Keeping records current improves accuracy.',
              style: TextStyle(fontSize: 14, color: Colors.grey),
            ),
            const SizedBox(height: 16),
            if (_healthSnapshots.isEmpty)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text(
                        'No forecast yet',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      SizedBox(height: 8),
                      Text(
                        'Add service entries and keep mileage up to date to generate a health forecast.',
                        style: TextStyle(color: Colors.grey),
                      ),
                    ],
                  ),
                ),
              ),
            ..._healthSnapshots.map(
              (snapshot) => Card(
                margin: const EdgeInsets.only(bottom: 16),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  snapshot.vehicleLabel,
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'VIN: ${snapshot.vin}',
                                  style: const TextStyle(color: Colors.grey),
                                ),
                              ],
                            ),
                          ),
                          _buildScoreBadge(snapshot.overallHealthScore),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        snapshot.accuracyTip,
                        style: const TextStyle(fontSize: 13, color: Colors.grey),
                      ),
                      const SizedBox(height: 16),
                      Wrap(
                        spacing: 12,
                        runSpacing: 12,
                        children: snapshot.components
                            .map((component) => _buildHealthCard(component))
                            .toList(),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            const SizedBox(height: 8),
            const Text(
              'Usage Insights',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildInsightCard(
                    title: 'Screen Views',
                    value:
                        _analyticsInsights['screenViews']?.toString() ?? '0',
                    icon: Icons.visibility,
                    color: Colors.blue,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildInsightCard(
                    title: 'Maintenance Entries',
                    value:
                        _maintenanceInsights['totalMaintenanceEntries']
                            ?.toString() ??
                        '0',
                    icon: Icons.build,
                    color: Colors.green,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            const Text(
              'Privacy Notice',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Vehicle health estimates use your saved vehicle and maintenance data. Keep records current to improve forecast accuracy.',
              style: TextStyle(fontSize: 14, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildScoreBadge(int score) {
    final color =
        score >= 80 ? Colors.green : score >= 50 ? Colors.orange : Colors.red;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        '$score',
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.bold,
          fontSize: 18,
        ),
      ),
    );
  }

  Widget _buildHealthCard(VehicleHealthComponent component) {
    final color = component.status == 'overdue'
        ? Colors.red
        : component.status == 'service soon'
            ? Colors.orange
            : component.status == 'watch'
                ? Colors.amber
                : Colors.green;

    return SizedBox(
      width: 150,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(12.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                component.label,
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                '${(component.remainingPercent * 100).round()}% left',
                style: TextStyle(fontSize: 22, color: color),
              ),
              const SizedBox(height: 6),
              Text(
                component.status,
                style: const TextStyle(fontSize: 12, color: Colors.grey),
              ),
              const SizedBox(height: 6),
              Text(
                component.remainingMiles != null
                    ? '${component.remainingMiles} mi'
                    : component.remainingDays != null
                        ? '${component.remainingDays} days'
                        : 'Estimate only',
                style: const TextStyle(fontSize: 12),
              ),
              const SizedBox(height: 4),
              Text(
                component.confidence,
                style: const TextStyle(fontSize: 12, color: Colors.grey),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInsightCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Icon(icon, size: 32, color: color),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              title,
              style: const TextStyle(fontSize: 12, color: Colors.grey),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
