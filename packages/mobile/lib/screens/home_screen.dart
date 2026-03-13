import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../components/app_bottom_nav.dart';
import '../models/maintenance_schedule.dart';
import '../models/vehicle.dart';
import '../services/auth_service.dart';
import '../services/firestore_service.dart';
import '../theme/design_tokens.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String _searchTerm = '';
  String? _selectedVin;

  Widget? _maintenanceUrgencyChip(Vehicle vehicle, ColorScheme colorScheme) {
    final items = MaintenanceSchedule.getUpcomingMaintenance(
      vehicle.make,
      vehicle.model,
      vehicle.mileage,
      vehicle.mileage + 10000,
    );
    if (items.isEmpty) return null;
    final miles = items.first['milesUntilDue'] as int;
    if (miles > 5000) return null;
    final isUrgent = miles <= 1000;
    return Container(
      margin: const EdgeInsets.only(top: 4),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: isUrgent ? Colors.red.shade100 : Colors.orange.shade100,
        borderRadius: BorderRadius.circular(99),
      ),
      child: Text(
        isUrgent ? '⚠ Maintenance due!' : 'Service due soon',
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: isUrgent ? Colors.red.shade800 : Colors.orange.shade800,
        ),
      ),
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
              ? Colors.red.shade500
              : isSoon
              ? Colors.orange.shade400
              : Colors.grey.shade400;
          final labelColor = isUrgent
              ? Colors.red.shade700
              : isSoon
              ? Colors.orange.shade700
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
    final authService = Provider.of<AuthService>(context);
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
                Container(
                  width: 96,
                  height: 96,
                  decoration: BoxDecoration(
                    color: AppDesignTokens.colorScheme(
                      Theme.of(context).brightness,
                    ).primary,
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: const Icon(
                    Icons.directions_car,
                    size: 48,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Vehicle Vitals',
                  style: Theme.of(context).textTheme.displayMedium,
                ),
                const SizedBox(height: 8),
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
      appBar: AppBar(
        title: const Text(
          'My Garage',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700),
        ),
        actions: [
          PopupMenuButton<String>(
            onSelected: (value) {
              switch (value) {
                case 'upcoming':
                  context.push('/app/upcoming');
                  break;
                case 'timeline':
                  context.push('/app/timeline');
                  break;
                case 'account':
                  context.push('/app/profile');
                  break;
                case 'signout':
                  authService.signOut();
                  break;
              }
            },
            itemBuilder: (context) => const [
              PopupMenuItem(
                value: 'upcoming',
                child: Row(
                  children: [
                    Icon(Icons.upcoming),
                    SizedBox(width: 8),
                    Text('Upcoming Tasks'),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'timeline',
                child: Row(
                  children: [
                    Icon(Icons.timeline),
                    SizedBox(width: 8),
                    Text('Timeline Dashboard'),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'account',
                child: Row(
                  children: [
                    Icon(Icons.account_circle),
                    SizedBox(width: 8),
                    Text('Profile'),
                  ],
                ),
              ),
              PopupMenuDivider(),
              PopupMenuItem(
                value: 'signout',
                child: Row(
                  children: [
                    Icon(Icons.logout),
                    SizedBox(width: 8),
                    Text('Sign Out'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: StreamBuilder<List<Vehicle>>(
        stream: firestoreService.getVehiclesStream(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          final vehicles = snapshot.data ?? [];
          final filtered = vehicles.where((vehicle) {
            final q = _searchTerm.toLowerCase();
            return vehicle.vin.toLowerCase().contains(q) ||
                vehicle.make.toLowerCase().contains(q) ||
                vehicle.model.toLowerCase().contains(q) ||
                vehicle.year.toString().contains(q);
          }).toList();

          if (_selectedVin == null && filtered.isNotEmpty) {
            _selectedVin = filtered.first.vin;
          }

          Vehicle? selected;
          if (_selectedVin != null) {
            for (final vehicle in filtered) {
              if (vehicle.vin == _selectedVin) {
                selected = vehicle;
                break;
              }
            }
            selected ??= filtered.isNotEmpty ? filtered.first : null;
            _selectedVin = selected?.vin;
          }

          return Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
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
                      onPressed: () => context.push('/app/add-vehicle'),
                      icon: const Icon(Icons.add),
                      label: const Text('Add'),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => context.push('/app/upcoming'),
                        icon: const Icon(Icons.upcoming),
                        label: const Text('Upcoming'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => context.push('/app/timeline'),
                        icon: const Icon(Icons.timeline),
                        label: const Text('Timeline'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: filtered.isEmpty
                      ? const Center(
                          child: Text('No vehicles match this filter.'),
                        )
                      : Column(
                          children: [
                            Expanded(
                              flex: 3,
                              child: Card(
                                margin: EdgeInsets.zero,
                                child: ListView.builder(
                                  padding: const EdgeInsets.all(12),
                                  itemCount: filtered.length,
                                  itemBuilder: (context, index) {
                                    final vehicle = filtered[index];
                                    final isSelected =
                                        vehicle.vin == selected?.vin;
                                    return Container(
                                      margin: const EdgeInsets.only(bottom: 8),
                                      decoration: BoxDecoration(
                                        color: isSelected
                                            ? colorScheme.primary.withValues(
                                                alpha: 0.12,
                                              )
                                            : colorScheme.surface,
                                        borderRadius: BorderRadius.circular(10),
                                        border: Border.all(
                                          color: isSelected
                                              ? colorScheme.primary.withValues(
                                                  alpha: 0.45,
                                                )
                                              : colorScheme.outline,
                                        ),
                                      ),
                                      child: ListTile(
                                        onTap: () {
                                          setState(() {
                                            _selectedVin = vehicle.vin;
                                          });
                                        },
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
                                        trailing: vehicle.recallsCount > 0
                                            ? Container(
                                                padding:
                                                    const EdgeInsets.symmetric(
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
                                              )
                                            : null,
                                      ),
                                    );
                                  },
                                ),
                              ),
                            ),
                            const SizedBox(height: 10),
                            Expanded(
                              flex: 4,
                              child: Card(
                                margin: EdgeInsets.zero,
                                child: selected == null
                                    ? const Center(
                                        child: Text('Select a vehicle'),
                                      )
                                    : Padding(
                                        padding: const EdgeInsets.all(14),
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              '${selected.year} ${selected.make} ${selected.model}',
                                              style: const TextStyle(
                                                fontWeight: FontWeight.w700,
                                                fontSize: 18,
                                              ),
                                            ),
                                            const SizedBox(height: 4),
                                            Text('VIN: ${selected.vin}'),
                                            const SizedBox(height: 4),
                                            Text(
                                              'Mileage: ${selected.mileage} miles',
                                            ),
                                            const SizedBox(height: 8),
                                            if (selected.recallsCount > 0)
                                              Text(
                                                'Open recalls: ${selected.recallsCount}',
                                                style: TextStyle(
                                                  color: colorScheme.secondary,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                            _buildMaintenanceSection(
                                              context,
                                              selected,
                                              colorScheme,
                                            ),
                                            const Spacer(),
                                            Row(
                                              children: [
                                                Expanded(
                                                  child: OutlinedButton.icon(
                                                    onPressed: () => context.push(
                                                      '/app/edit-vehicle/${selected!.vin}',
                                                    ),
                                                    icon: const Icon(
                                                      Icons.edit,
                                                      size: 16,
                                                    ),
                                                    label: const Text('Edit'),
                                                  ),
                                                ),
                                                const SizedBox(width: 8),
                                                Expanded(
                                                  child: OutlinedButton.icon(
                                                    onPressed: () => context.push(
                                                      '/app/records/${selected!.vin}',
                                                    ),
                                                    icon: const Icon(
                                                      Icons.folder_open,
                                                      size: 16,
                                                    ),
                                                    label: const Text(
                                                      'Records',
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 8),
                                            SizedBox(
                                              width: double.infinity,
                                              child: ElevatedButton.icon(
                                                onPressed: () => context.push(
                                                  '/app/maintenance/${selected!.vin}',
                                                ),
                                                icon: const Icon(
                                                  Icons.build,
                                                  size: 16,
                                                ),
                                                label: const Text(
                                                  'Maintenance',
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                              ),
                            ),
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
