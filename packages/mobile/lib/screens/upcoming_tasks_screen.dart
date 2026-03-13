import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../components/app_bottom_nav.dart';
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
    final scheme = Theme.of(context).colorScheme;
    if (milesUntilDue <= 1000) return scheme.error;
    if (milesUntilDue <= 5000) return scheme.secondary;
    return scheme.primary;
  }

  Color _getUrgencyBackgroundColor(int milesUntilDue) {
    if (milesUntilDue <= 1000) {
      return Theme.of(context).colorScheme.error.withValues(alpha: 0.08);
    }
    if (milesUntilDue <= 5000) {
      return Theme.of(context).colorScheme.secondary.withValues(alpha: 0.1);
    }
    return Theme.of(context).colorScheme.primary.withValues(alpha: 0.08);
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
      final colorScheme = Theme.of(context).colorScheme;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Calendar event created for $target.'),
          backgroundColor: colorScheme.primary,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      final colorScheme = Theme.of(context).colorScheme;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to add to calendar: $e'),
          backgroundColor: colorScheme.error,
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
        bottomNavigationBar: const AppBottomNav(currentIndex: 1),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Upcoming Tasks'),
        actions: [
          IconButton(
            icon: const Icon(Icons.timeline),
            tooltip: 'Timeline',
            onPressed: () => context.push('/app/timeline'),
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadUpcomingTasks,
          ),
        ],
      ),
      body: _upcomingItems.isEmpty ? _buildEmptyState() : _buildUpcomingList(),
      bottomNavigationBar: const AppBottomNav(currentIndex: 1),
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
    final urgentCount = _upcomingItems
        .where((item) => (item['milesUntilDue'] as int) <= 1000)
        .length;
    final soonCount = _upcomingItems
        .where(
          (item) =>
              (item['milesUntilDue'] as int) > 1000 &&
              (item['milesUntilDue'] as int) <= 5000,
        )
        .length;

    return ListView.builder(
      padding: EdgeInsets.all(TwSpace.s4),
      itemCount: _upcomingItems.length + 2, // +2 for summary and legend
      itemBuilder: (context, index) {
        if (index == 0) {
          return Container(
            margin: EdgeInsets.only(bottom: TwSpace.s3),
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
                  'Reminder Center',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                SizedBox(height: TwSpace.s2),
                Text(
                  'Urgent: $urgentCount  •  Soon: $soonCount  •  Queue: ${_upcomingItems.length}',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
          );
        }

        if (index == _upcomingItems.length + 1) {
          return _buildLegend();
        }

        final item = _upcomingItems[index - 1];
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
                Theme.of(context).colorScheme.error.withValues(alpha: 0.2),
                Theme.of(context).colorScheme.error,
              ),
              SizedBox(width: TwSpace.s4),
              _buildLegendItem(
                'Soon (≤5,000 miles)',
                Theme.of(context).colorScheme.secondary.withValues(alpha: 0.2),
                Theme.of(context).colorScheme.secondary,
              ),
              SizedBox(width: TwSpace.s4),
              _buildLegendItem(
                'Upcoming (>5,000 miles)',
                Theme.of(context).colorScheme.primary.withValues(alpha: 0.2),
                Theme.of(context).colorScheme.primary,
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
