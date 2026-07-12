import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../components/ad_banner.dart';
import '../components/app_bottom_nav.dart';
import '../models/maintenance.dart';
import '../models/vehicle.dart';
import '../services/calendar_service.dart';
import '../services/data_export_service.dart';
import '../services/firestore_service.dart';
import '../services/maintenance_plan_service.dart';
import '../services/premium_service.dart';
import '../theme/design_tokens.dart';
import 'maintenance_detail_screen.dart';

String _performedByLabel(String value) {
  switch (value) {
    case 'self':
      return 'Self-service';
    case 'business':
      return 'Business-maintained';
    default:
      return 'Mechanic';
  }
}

String _coverageLabel(String value) {
  switch (value) {
    case 'parts_only':
      return 'Parts only';
    default:
      return 'Parts and labor';
  }
}

class MaintenanceListScreen extends StatefulWidget {
  final String vin;

  const MaintenanceListScreen({super.key, required this.vin});

  @override
  State<MaintenanceListScreen> createState() => _MaintenanceListScreenState();
}

class _MaintenanceListScreenState extends State<MaintenanceListScreen> {
  final _titleController = TextEditingController();
  final _notesController = TextEditingController();
  final _costController = TextEditingController();
  final _providerNameController = TextEditingController();
  String _performedBy = 'mechanic';
  String _coverage = 'parts_and_labor';
  final DataExportService _exportService = DataExportService();
  final CalendarService _calendarService = CalendarService();
  List<Maintenance> _entries = [];
  Vehicle? _vehicle;
  bool _loading = true;
  bool _loadingVehicle = true;
  MaintenancePlan? _maintenancePlan;
  final MaintenancePlanService _maintenancePlanService =
      MaintenancePlanService();

  @override
  void initState() {
    super.initState();
    _loadVehicle();
    _loadEntries();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _notesController.dispose();
    _costController.dispose();
    _providerNameController.dispose();
    super.dispose();
  }

  Future<void> _loadVehicle() async {
    setState(() => _loadingVehicle = true);
    try {
      final firestoreService = context.read<FirestoreService>();
      final vehicle = await firestoreService.getVehicle(widget.vin);

      MaintenancePlan? plan;
      if (vehicle != null && vehicle.mileage > 0) {
        try {
          plan = await _maintenancePlanService.getMaintenancePlan(
            vin: vehicle.vin,
            currentMileage: vehicle.mileage,
            make: vehicle.make,
            model: vehicle.model,
          );
        } catch (_) {
          // Leave plan null; the recommended-maintenance card just won't
          // render its schedule list.
        }
      }

      if (!mounted) return;
      setState(() {
        _vehicle = vehicle;
        _maintenancePlan = plan;
        _loadingVehicle = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loadingVehicle = false);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error loading vehicle: $e')));
    }
  }

  Future<void> _loadEntries() async {
    setState(() => _loading = true);
    try {
      final firestoreService = context.read<FirestoreService>();
      final entries = await firestoreService.getMaintenanceEntries(widget.vin);
      if (!mounted) return;
      setState(() {
        _entries = entries;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading maintenance entries: $e')),
      );
    }
  }

  Future<void> _addEntry() async {
    if (_titleController.text.trim().isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Title is required')));
      return;
    }

    final costText = _costController.text.trim();
    double? cost;
    if (costText.isNotEmpty) {
      cost = double.tryParse(costText);
      if (cost == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Cost must be a valid number')),
        );
        return;
      }
    }

    try {
      final firestoreService = context.read<FirestoreService>();
      await firestoreService.addMaintenanceEntry(
        widget.vin,
        Maintenance(
          id: '', // Will be set by Firestore
          title: _titleController.text.trim(),
          notes: _notesController.text.trim(),
          cost: cost ?? 0.0,
          performedBy: _performedBy,
          providerName: _performedBy == 'self'
              ? ''
              : _providerNameController.text.trim(),
          coverage: _coverage,
          date: DateTime.now(),
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
      );

      _titleController.clear();
      _notesController.clear();
      _costController.clear();
      _providerNameController.clear();
      _performedBy = 'mechanic';
      _coverage = 'parts_and_labor';

      await _loadEntries();

      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Maintenance entry added')));

      // Show interstitial ad after adding maintenance entry (only for non-premium users)
      final premiumService = context.read<PremiumService>();
      if (premiumService.shouldShowAds()) {
        InterstitialAdHelper.showAd();
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error adding entry: $e')));
    }
  }

  Future<void> exportAsCSV() async {
    try {
      await _exportService.exportMaintenanceAsCSV(widget.vin);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Maintenance data exported as CSV')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Export failed: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> exportAsPDF() async {
    try {
      await _exportService.exportMaintenanceAsPDF(widget.vin);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Maintenance data exported as PDF')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Export failed: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> exportAsExcel() async {
    try {
      await _exportService.exportMaintenanceAsExcel(widget.vin);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Maintenance data exported as Excel')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Export failed: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> _syncToCalendar() async {
    final premiumService = context.read<PremiumService>();
    if (!premiumService.canAccessFeature('calendar_sync')) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Calendar sync requires Pro or Premium. Upgrade to continue.',
            ),
          ),
        );
        context.push('/app/premium');
      }
      return;
    }

    try {
      final eventsAdded = await _calendarService
          .syncUpcomingMaintenanceToCalendar();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Added $eventsAdded maintenance events to calendar'),
            backgroundColor: AppDesignTokens.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Calendar sync failed: ${e.toString()}'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final premiumService = context.watch<PremiumService>();
    final canExportPdf = premiumService.canAccessFeature('pdf_export');
    final canExportExcel = premiumService.canAccessFeature('excel_export');

    return Scaffold(
      appBar: AppBar(
        title: Text('Maintenance - ${widget.vin}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_today),
            tooltip: 'Sync to Calendar',
            onPressed: _syncToCalendar,
          ),
          PopupMenuButton<String>(
            onSelected: (value) {
              switch (value) {
                case 'export_csv':
                  exportAsCSV();
                  break;
                case 'export_pdf':
                  exportAsPDF();
                  break;
                case 'export_excel':
                  exportAsExcel();
                  break;
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'export_csv',
                child: Text('Export as CSV'),
              ),
              if (canExportPdf)
                const PopupMenuItem(
                  value: 'export_pdf',
                  child: Text('Export as PDF'),
                ),
              if (canExportExcel)
                const PopupMenuItem(
                  value: 'export_excel',
                  child: Text('Export as Excel'),
                ),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          // Add new entry form
          Card(
            margin: const EdgeInsets.all(16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Add Maintenance Entry',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _titleController,
                    decoration: const InputDecoration(
                      labelText: 'Title *',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _notesController,
                    decoration: const InputDecoration(
                      labelText: 'Notes',
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 3,
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey.shade300),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      children: [
                        DropdownButtonFormField<String>(
                          initialValue: _performedBy,
                          decoration: const InputDecoration(
                            labelText: 'Who did it',
                            border: OutlineInputBorder(),
                          ),
                          items: const [
                            DropdownMenuItem(
                              value: 'self',
                              child: Text('Self-service'),
                            ),
                            DropdownMenuItem(
                              value: 'mechanic',
                              child: Text('Mechanic'),
                            ),
                            DropdownMenuItem(
                              value: 'business',
                              child: Text('Business-maintained'),
                            ),
                          ],
                          onChanged: (value) {
                            if (value == null) return;
                            setState(() => _performedBy = value);
                          },
                        ),
                        if (_performedBy != 'self') ...[
                          const SizedBox(height: 12),
                          TextField(
                            controller: _providerNameController,
                            decoration: const InputDecoration(
                              labelText: 'Shop / mechanic name',
                              hintText: 'e.g. Downtown Auto Repair',
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ],
                        const SizedBox(height: 12),
                        DropdownButtonFormField<String>(
                          initialValue: _coverage,
                          decoration: const InputDecoration(
                            labelText: 'Receipt type',
                            border: OutlineInputBorder(),
                          ),
                          items: const [
                            DropdownMenuItem(
                              value: 'parts_only',
                              child: Text('Parts only'),
                            ),
                            DropdownMenuItem(
                              value: 'parts_and_labor',
                              child: Text('Parts and labor'),
                            ),
                          ],
                          onChanged: (value) {
                            if (value == null) return;
                            setState(() => _coverage = value);
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _costController,
                    decoration: const InputDecoration(
                      labelText: 'Cost',
                      border: OutlineInputBorder(),
                      prefixText: '\$',
                    ),
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _addEntry,
                    child: const Text('Add Entry'),
                  ),
                ],
              ),
            ),
          ),
          // Manufacturer schedules section
          if (!_loadingVehicle && _vehicle != null) ...[
            Card(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Recommended Maintenance',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${_vehicle!.make} ${_vehicle!.model} (${_vehicle!.year})',
                      style: const TextStyle(fontSize: 14, color: Colors.grey),
                    ),
                    const SizedBox(height: 16),
                    Builder(
                      builder: (context) {
                        final plan = _maintenancePlan;
                        if (plan == null || plan.items.isEmpty) {
                          return const Text(
                            'No maintenance schedule available for this vehicle.',
                            style: TextStyle(
                              fontStyle: FontStyle.italic,
                              color: Colors.grey,
                            ),
                          );
                        }
                        final mileage = _vehicle!.mileage;
                        final schedules = [...plan.items]
                          ..sort(
                            (a, b) =>
                                a.nextDueMileage.compareTo(b.nextDueMileage),
                          );
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (!plan.modelSpecific)
                              const Padding(
                                padding: EdgeInsets.only(bottom: 8),
                                child: Text(
                                  'No manufacturer data for this vehicle — showing a generic estimate.',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontStyle: FontStyle.italic,
                                    color: Colors.grey,
                                  ),
                                ),
                              ),
                            ...schedules.take(3).map((schedule) {
                              final milesUntilDue =
                                  (schedule.nextDueMileage - mileage).clamp(
                                    0,
                                    1 << 30,
                                  );
                              return ListTile(
                                dense: true,
                                leading: const Icon(Icons.build, size: 20),
                                title: Text(
                                  formatServiceTypeLabel(schedule.serviceType),
                                ),
                                subtitle: Text(
                                  'Due: ${schedule.nextDueMileage} miles ($milesUntilDue miles)',
                                ),
                                trailing: Text(
                                  'Every ${schedule.intervalMiles} mi',
                                ),
                              );
                            }),
                          ],
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],
          // Entries list
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _entries.isEmpty
                ? const Center(
                    child: Text(
                      'No maintenance entries yet.\nAdd one using the form above.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 16, color: Colors.grey),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _entries.length,
                    itemBuilder: (context, index) {
                      final entry = _entries[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          title: Text(entry.title),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (entry.notes.isNotEmpty) Text(entry.notes),
                              Text(
                                entry.providerName.isNotEmpty
                                    ? '${_performedByLabel(entry.performedBy)} (${entry.providerName}) • ${_coverageLabel(entry.coverage)}'
                                    : '${_performedByLabel(entry.performedBy)} • ${_coverageLabel(entry.coverage)}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Cost: \$${entry.cost.toStringAsFixed(2)} • ${entry.date.day}/${entry.date.month}/${entry.date.year}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                          onTap: () async {
                            final result = await Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => MaintenanceDetailScreen(
                                  vin: widget.vin,
                                  entryId: entry.id,
                                ),
                              ),
                            );
                            if (result == true) {
                              _loadEntries();
                            }
                          },
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
      bottomNavigationBar: const AppBottomNav(currentIndex: 0),
    );
  }
}
