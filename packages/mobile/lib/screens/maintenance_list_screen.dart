import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../components/ad_banner.dart';
import '../components/app_bottom_nav.dart';
import '../models/maintenance.dart';
import '../models/maintenance_schedule.dart';
import '../models/vehicle.dart';
import '../services/calendar_service.dart';
import '../services/data_export_service.dart';
import '../services/firestore_service.dart';
import '../services/premium_service.dart';
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
  String _performedBy = 'mechanic';
  String _coverage = 'parts_and_labor';
  final DataExportService _exportService = DataExportService();
  final CalendarService _calendarService = CalendarService();
  List<Maintenance> _entries = [];
  Vehicle? _vehicle;
  bool _loading = true;
  bool _loadingVehicle = true;

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
    super.dispose();
  }

  Future<void> _loadVehicle() async {
    setState(() => _loadingVehicle = true);
    try {
      final firestoreService = context.read<FirestoreService>();
      final vehicle = await firestoreService.getVehicle(widget.vin);
      if (!mounted) return;
      setState(() {
        _vehicle = vehicle;
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
          coverage: _coverage,
          date: DateTime.now(),
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
      );

      _titleController.clear();
      _notesController.clear();
      _costController.clear();
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
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Calendar sync failed: ${e.toString()}'),
            backgroundColor: Colors.red,
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
                  const Text(
                    'Add Maintenance Entry',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
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
                    const Text(
                      'Recommended Maintenance',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${_vehicle!.make} ${_vehicle!.model} (${_vehicle!.year})',
                      style: const TextStyle(fontSize: 14, color: Colors.grey),
                    ),
                    const SizedBox(height: 16),
                    Builder(
                      builder: (context) {
                        final schedules =
                            MaintenanceSchedule.getUpcomingMaintenance(
                              _vehicle!.make,
                              _vehicle!.model,
                              _vehicle!.mileage,
                            );
                        if (schedules.isEmpty) {
                          return const Text(
                            'No manufacturer schedules available for this vehicle.',
                            style: TextStyle(
                              fontStyle: FontStyle.italic,
                              color: Colors.grey,
                            ),
                          );
                        }
                        return Column(
                          children: schedules.take(3).map((schedule) {
                            return ListTile(
                              dense: true,
                              leading: const Icon(Icons.build, size: 20),
                              title: Text(schedule['description']),
                              subtitle: Text(
                                'Due: ${schedule['nextDueMileage']} miles (${schedule['milesUntilDue']} miles)',
                              ),
                              trailing: Text(schedule['frequency']),
                            );
                          }).toList(),
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
                                '${_performedByLabel(entry.performedBy)} • ${_coverageLabel(entry.coverage)}',
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
