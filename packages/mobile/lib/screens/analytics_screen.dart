import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/analytics_service.dart';

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  Map<String, dynamic> _analyticsInsights = {};
  Map<String, dynamic> _maintenanceInsights = {};
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
      final analyticsData = await analyticsService.getAnalyticsInsights();
      final maintenanceData = await analyticsService.getMaintenanceInsights();

      setState(() {
        _analyticsInsights = analyticsData;
        _maintenanceInsights = maintenanceData;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load analytics: ${e.toString()}'),
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
        appBar: AppBar(title: const Text('Analytics')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Analytics'),
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
            // Analytics Settings
            Consumer<AnalyticsService>(
              builder: (context, analyticsService, child) {
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Analytics Settings',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Help improve Vehicle Vitals by sharing anonymous usage data.',
                          style: TextStyle(fontSize: 14, color: Colors.grey),
                        ),
                        const SizedBox(height: 16),
                        SwitchListTile(
                          title: const Text('Enable Analytics'),
                          subtitle: const Text('Share anonymous usage data'),
                          value: analyticsService.isAnalyticsEnabled,
                          onChanged: (value) =>
                              analyticsService.setAnalyticsEnabled(value),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),

            const SizedBox(height: 24),

            // Usage Insights
            if (_analyticsInsights.isNotEmpty) ...[
              const Text(
                'Usage Insights (Last 30 Days)',
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
                      title: 'Actions',
                      value:
                          ((_analyticsInsights['maintenanceActions'] as int? ??
                                      0) +
                                  (_analyticsInsights['vehicleActions']
                                          as int? ??
                                      0))
                              .toString(),
                      icon: Icons.touch_app,
                      color: Colors.green,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              if (_analyticsInsights['mostVisitedScreen'] != null)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Most Visited Screen',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _analyticsInsights['mostVisitedScreen'],
                          style: const TextStyle(
                            fontSize: 18,
                            color: Colors.blue,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],

            const SizedBox(height: 24),

            // Maintenance Insights
            if (_maintenanceInsights.isNotEmpty) ...[
              const Text(
                'Maintenance Insights',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),

              Row(
                children: [
                  Expanded(
                    child: _buildInsightCard(
                      title: 'Total Vehicles',
                      value:
                          _maintenanceInsights['totalVehicles']?.toString() ??
                          '0',
                      icon: Icons.directions_car,
                      color: Colors.purple,
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
                      color: Colors.orange,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              Row(
                children: [
                  Expanded(
                    child: _buildInsightCard(
                      title: 'Total Cost',
                      value:
                          '\$${_maintenanceInsights['totalMaintenanceCost']?.toStringAsFixed(2) ?? '0.00'}',
                      icon: Icons.attach_money,
                      color: Colors.red,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _buildInsightCard(
                      title: 'Avg Cost/Entry',
                      value:
                          '\$${_maintenanceInsights['averageCostPerEntry']?.toStringAsFixed(2) ?? '0.00'}',
                      icon: Icons.trending_up,
                      color: Colors.teal,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              if (_maintenanceInsights['mostCommonMaintenance'] != null)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Most Common Service',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _maintenanceInsights['mostCommonMaintenance'],
                          style: const TextStyle(
                            fontSize: 18,
                            color: Colors.orange,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

              const SizedBox(height: 16),

              // Recent Maintenance
              if ((_maintenanceInsights['recentMaintenance'] as List?)
                      ?.isNotEmpty ??
                  false)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Recent Maintenance',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 16),
                        ...(_maintenanceInsights['recentMaintenance'] as List)
                            .take(5)
                            .map<Widget>((entry) {
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 8.0),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        entry['title'] ?? 'Unknown',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ),
                                    Text(
                                      '\$${entry['cost']?.toStringAsFixed(2) ?? '0.00'}',
                                      style: const TextStyle(
                                        color: Colors.green,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }),
                      ],
                    ),
                  ),
                ),
            ],

            const SizedBox(height: 24),

            // Privacy Notice
            const Text(
              'Privacy Notice',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Analytics data is anonymous and used only to improve the app experience. No personal information or vehicle data is collected.',
              style: TextStyle(fontSize: 14, color: Colors.grey),
            ),
          ],
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
