import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/maintenance_schedule.dart';
import '../models/vehicle.dart';
import '../services/calendar_service.dart';
import '../services/firestore_service.dart';
import '../theme/design_tokens.dart';
import '../theme/tailwind_utilities.dart';
import 'maintenance_list_screen.dart';

class UpcomingTasksScreen extends StatefulWidget {
  const UpcomingTasksScreen({super.key});

  @override
  State<UpcomingTasksScreen> createState() => _UpcomingTasksScreenState();
}

class _UpcomingTasksScreenState extends State<UpcomingTasksScreen> {
  List<Map<String, dynamic>> _upcomingItems = [];
  bool _loading = true;
  final CalendarService _calendarService = CalendarService();

  @override
  void initState() {
    super.initState();
    _loadUpcomingTasks();
  }

  Future<void> _loadUpcomingTasks() async {
    setState(() => _loading = true);

    try {
      final firestoreService = context.read<FirestoreService>();
      final vehicles = await firestoreService.getVehicles();

      final allUpcoming = <Map<String, dynamic>>[];

      for (final vehicle in vehicles) {
        final currentMileage = vehicle.mileage;
        final upcoming = MaintenanceSchedule.getUpcomingMaintenance(
          vehicle.make,
          vehicle.model,
          currentMileage,
        );

        for (final item in upcoming) {
          allUpcoming.add({...item, 'vehicle': vehicle});
        }
      }

      // Sort by miles until due (most urgent first)
      allUpcoming.sort(
        (a, b) =>
            (a['milesUntilDue'] as int).compareTo(b['milesUntilDue'] as int),
      );

      setState(() {
        _upcomingItems = allUpcoming;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading upcoming tasks: $e')),
        );
      }
    }
  }

  Color _getUrgencyColor(int milesUntilDue) {
    if (milesUntilDue <= 1000) return AppDesignTokens.danger;
    if (milesUntilDue <= 5000) return Colors.orange;
    return AppDesignTokens.colorScheme(Theme.of(context).brightness).primary;
  }

  Color _getUrgencyBackgroundColor(int milesUntilDue) {
    if (milesUntilDue <= 1000) return Colors.red.shade50;
    if (milesUntilDue <= 5000) return Colors.orange.shade50;
    return AppDesignTokens.colorScheme(
      Theme.of(context).brightness,
    ).primary.withValues(alpha: 0.1);
  }

  String _getUrgencyLabel(int milesUntilDue) {
    if (milesUntilDue <= 1000) return 'Urgent';
    if (milesUntilDue <= 5000) return 'Soon';
    return 'Upcoming';
  }

  DateTime _estimateDueDate(int milesUntilDue) {
    final dayOffset = (milesUntilDue / 100).ceil().clamp(1, 180);
    return DateTime.now().add(Duration(days: dayOffset));
  }

  Future<void> _addItemToCalendar(
    Vehicle vehicle,
    Map<String, dynamic> item,
  ) async {
    try {
      final dueDate = _estimateDueDate(item['milesUntilDue'] as int);
      final event = await _calendarService.addMaintenanceToCalendar(
        vehicleVin: vehicle.vin,
        title: item['description'] as String,
        description: 'Maintenance reminder from Vehicle Vitals',
        dueDate: dueDate,
        vehicleInfo: '${vehicle.year} ${vehicle.make} ${vehicle.model}',
      );

      if (!mounted) return;
      final target = (event['target'] ?? 'calendar').toString();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Calendar event created for $target.'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to add to calendar: $e'),
          backgroundColor: AppDesignTokens.danger,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Upcoming Tasks')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Upcoming Tasks'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadUpcomingTasks,
          ),
        ],
      ),
      body: _upcomingItems.isEmpty ? _buildEmptyState() : _buildUpcomingList(),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.check_circle_outline,
            size: 64,
            color: AppDesignTokens.colorScheme(
              Theme.of(context).brightness,
            ).primary,
          ),
          const SizedBox(height: 16),
          Text(
            'All caught up!',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          Text(
            'No upcoming maintenance tasks found.\nYour vehicles are well maintained.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Theme.of(
                context,
              ).textTheme.bodyMedium?.color?.withValues(alpha: 0.7),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUpcomingList() {
    return ListView.builder(
      padding: EdgeInsets.all(TwSpace.s4),
      itemCount: _upcomingItems.length + 1, // +1 for legend
      itemBuilder: (context, index) {
        if (index == _upcomingItems.length) {
          return _buildLegend();
        }

        final item = _upcomingItems[index];
        final vehicle = item['vehicle'] as Vehicle;
        final milesUntilDue = item['milesUntilDue'] as int;

        return Card(
          margin: EdgeInsets.only(bottom: TwSpace.s3),
          color: _getUrgencyBackgroundColor(milesUntilDue),
          child: Padding(
            padding: EdgeInsets.all(TwSpace.s4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        item['description'] as String,
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w600),
                      ),
                    ),
                    Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: TwSpace.s2,
                        vertical: TwSpace.s1,
                      ),
                      decoration: BoxDecoration(
                        color: _getUrgencyColor(
                          milesUntilDue,
                        ).withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(TwRadius.sm),
                        border: Border.all(
                          color: _getUrgencyColor(
                            milesUntilDue,
                          ).withValues(alpha: 0.3),
                        ),
                      ),
                      child: Text(
                        _getUrgencyLabel(milesUntilDue),
                        style: TextStyle(
                          color: _getUrgencyColor(milesUntilDue),
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
                SizedBox(height: TwSpace.s2),
                Text(
                  '${vehicle.year} ${vehicle.make} ${vehicle.model}',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(
                      context,
                    ).textTheme.bodyMedium?.color?.withValues(alpha: 0.7),
                  ),
                ),
                SizedBox(height: TwSpace.s1),
                Text(
                  item['frequency'] as String,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(
                      context,
                    ).textTheme.bodySmall?.color?.withValues(alpha: 0.7),
                  ),
                ),
                SizedBox(height: TwSpace.s3),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Due at: ${(item['nextDueMileage'] as int).toStringAsFixed(0)} miles',
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(
                                  color: Theme.of(context)
                                      .textTheme
                                      .bodySmall
                                      ?.color
                                      ?.withValues(alpha: 0.7),
                                ),
                          ),
                          Text(
                            'Miles until due: ${milesUntilDue.toStringAsFixed(0)}',
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(
                                  color: Theme.of(context)
                                      .textTheme
                                      .bodySmall
                                      ?.color
                                      ?.withValues(alpha: 0.7),
                                ),
                          ),
                        ],
                      ),
                    ),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        OutlinedButton(
                          onPressed: () => _addItemToCalendar(vehicle, item),
                          child: const Text('Add to Calendar'),
                        ),
                        SizedBox(width: TwSpace.s2),
                        ElevatedButton(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) =>
                                    MaintenanceListScreen(vin: vehicle.vin),
                              ),
                            );
                          },
                          child: const Text('Mark Complete'),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildLegend() {
    return Container(
      margin: EdgeInsets.only(top: TwSpace.s4),
      padding: EdgeInsets.all(TwSpace.s4),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(TwRadius.lg),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Legend',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w600,
              color: Theme.of(
                context,
              ).textTheme.titleSmall?.color?.withValues(alpha: 0.7),
            ),
          ),
          SizedBox(height: TwSpace.s2),
          Row(
            children: [
              _buildLegendItem(
                'Urgent (≤1,000 miles)',
                Colors.red.shade100,
                Colors.red,
              ),
              SizedBox(width: TwSpace.s4),
              _buildLegendItem(
                'Soon (≤5,000 miles)',
                Colors.orange.shade100,
                Colors.orange,
              ),
              SizedBox(width: TwSpace.s4),
              _buildLegendItem(
                'Upcoming (>5,000 miles)',
                Colors.green.shade100,
                Colors.green,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLegendItem(
    String label,
    Color backgroundColor,
    Color textColor,
  ) {
    return Expanded(
      child: Row(
        children: [
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              color: backgroundColor,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          SizedBox(width: TwSpace.s2),
          Expanded(
            child: Text(
              label,
              style: TextStyle(color: textColor, fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }
}
