import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../components/app_bottom_nav.dart';
import '../models/maintenance.dart';
import '../models/vehicle.dart';
import '../services/firestore_service.dart';

class TimelineDashboardScreen extends StatefulWidget {
  const TimelineDashboardScreen({super.key});

  @override
  State<TimelineDashboardScreen> createState() =>
      _TimelineDashboardScreenState();
}

class _TimelineDashboardScreenState extends State<TimelineDashboardScreen> {
  bool _loading = true;
  String? _error;
  List<_TimelineEvent> _events = [];
  List<Vehicle> _vehicles = [];
  String _selectedVinFilter = 'all';
  int _daysFilter = 365;
  int _vehicleCount = 0;

  @override
  void initState() {
    super.initState();
    _loadTimeline();
  }

  Future<void> _loadTimeline() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final firestoreService = context.read<FirestoreService>();
      final vehicles = await firestoreService.getVehicles();
      final events = <_TimelineEvent>[];

      for (final vehicle in vehicles) {
        final entries = await firestoreService.getMaintenanceEntries(
          vehicle.vin,
        );
        for (final entry in entries) {
          events.add(_TimelineEvent(vehicle: vehicle, entry: entry));
        }
      }

      events.sort((a, b) => b.entry.date.compareTo(a.entry.date));

      if (!mounted) return;
      setState(() {
        _events = events;
        _vehicles = vehicles;
        _vehicleCount = vehicles.length;
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

  String _formatDate(DateTime date) {
    final month = date.month.toString().padLeft(2, '0');
    final day = date.day.toString().padLeft(2, '0');
    return '${date.year}-$month-$day';
  }

  List<_TimelineEvent> _filteredEvents() {
    final now = DateTime.now();
    return _events.where((event) {
      if (_selectedVinFilter != 'all' &&
          event.vehicle.vin != _selectedVinFilter) {
        return false;
      }
      if (_daysFilter > 0) {
        final oldestAllowed = now.subtract(Duration(days: _daysFilter));
        if (event.entry.date.isBefore(oldestAllowed)) {
          return false;
        }
      }
      return true;
    }).toList();
  }

  String _dateFilterLabel(int days) {
    if (days <= 0) return 'All';
    if (days == 30) return '30d';
    if (days == 90) return '90d';
    return '1y';
  }

  @override
  Widget build(BuildContext context) {
    final filteredEvents = _filteredEvents();
    final filteredCost = filteredEvents.fold<double>(
      0,
      (sum, event) => sum + event.entry.cost,
    );

    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Timeline Dashboard')),
        body: const Center(child: CircularProgressIndicator()),
        bottomNavigationBar: const AppBottomNav(currentIndex: 2),
      );
    }

    if (_error != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Timeline Dashboard')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.error_outline,
                  color: Theme.of(context).colorScheme.error,
                  size: 40,
                ),
                const SizedBox(height: 12),
                Text(
                  'Unable to load timeline: $_error',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: _loadTimeline,
                  child: const Text('Try again'),
                ),
              ],
            ),
          ),
        ),
        bottomNavigationBar: const AppBottomNav(currentIndex: 2),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Timeline Dashboard'),
        actions: [
          IconButton(onPressed: _loadTimeline, icon: const Icon(Icons.refresh)),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Timeline Summary',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _SummaryCard(
                    title: 'Vehicles',
                    value: _vehicleCount.toString(),
                    icon: Icons.directions_car,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _SummaryCard(
                    title: 'Timeline Events',
                    value: filteredEvents.length.toString(),
                    icon: Icons.timeline,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _SummaryCard(
                    title: 'Total Cost',
                    value: '\$${filteredCost.toStringAsFixed(2)}',
                    icon: Icons.attach_money,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _selectedVinFilter,
              decoration: const InputDecoration(
                labelText: 'Vehicle',
                border: OutlineInputBorder(),
                isDense: true,
              ),
              items: [
                const DropdownMenuItem(
                  value: 'all',
                  child: Text('All vehicles'),
                ),
                ..._vehicles.map((vehicle) {
                  return DropdownMenuItem(
                    value: vehicle.vin,
                    child: Text(
                      '${vehicle.year} ${vehicle.make} ${vehicle.model}',
                      overflow: TextOverflow.ellipsis,
                    ),
                  );
                }),
              ],
              onChanged: (value) {
                if (value == null) return;
                setState(() {
                  _selectedVinFilter = value;
                });
              },
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [30, 90, 365, 0].map((days) {
                final selected = _daysFilter == days;
                return ChoiceChip(
                  label: Text(_dateFilterLabel(days)),
                  selected: selected,
                  onSelected: (_) {
                    setState(() {
                      _daysFilter = days;
                    });
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 16),
            Text('Event Feed', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Expanded(
              child: filteredEvents.isEmpty
                  ? const Center(
                      child: Text('No maintenance events for current filters.'),
                    )
                  : ListView.builder(
                      itemCount: filteredEvents.length,
                      itemBuilder: (context, index) {
                        final event = filteredEvents[index];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 10),
                          child: ListTile(
                            leading: const Icon(Icons.build_circle_outlined),
                            title: Text(event.entry.title),
                            subtitle: Text(
                              '${event.vehicle.year} ${event.vehicle.make} ${event.vehicle.model}\n${_formatDate(event.entry.date)}${event.entry.notes.isNotEmpty ? '\n${event.entry.notes}' : ''}',
                            ),
                            trailing: event.entry.cost > 0
                                ? Text(
                                    '\$${event.entry.cost.toStringAsFixed(2)}',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                    ),
                                  )
                                : null,
                            isThreeLine: true,
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: const AppBottomNav(currentIndex: 2),
    );
  }
}

class _TimelineEvent {
  final Vehicle vehicle;
  final Maintenance entry;

  _TimelineEvent({required this.vehicle, required this.entry});
}

class _SummaryCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;

  const _SummaryCard({
    required this.title,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colorScheme.outline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: colorScheme.primary),
          const SizedBox(height: 6),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
          ),
          const SizedBox(height: 2),
          Text(
            title,
            style: TextStyle(fontSize: 12, color: colorScheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}
