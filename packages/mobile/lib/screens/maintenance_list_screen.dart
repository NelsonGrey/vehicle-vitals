import 'dart:async';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../components/ad_banner.dart';
import '../components/app_bottom_nav.dart';
import '../models/maintenance.dart';
import '../models/maintenance_attachment.dart';
import '../models/vehicle.dart';
import '../services/attachment_analysis_service.dart';
import '../services/calendar_service.dart';
import '../services/data_export_service.dart';
import '../services/firestore_service.dart';
import '../services/maintenance_plan_service.dart';
import '../services/premium_service.dart';
import '../services/record_storage_service.dart';
import '../theme/design_tokens.dart';
import '../utils/number_format.dart';
import '../utils/user_facing_error.dart';
import 'maintenance_detail_screen.dart';
import 'maintenance_insights_screen.dart';

// An attachment picked (and immediately uploaded) while filling out the Add
// Entry form, before the entry itself is saved. Uploaded eagerly against a
// pre-reserved entry id so analysis can run and pre-fill the form fields —
// see _MaintenanceListScreenState._draftEntryId.
class _PendingAttachment {
  final PlatformFile file;
  MaintenanceAttachment? uploaded;
  bool busy = true;
  String? error;
  bool notEntitled = false;

  _PendingAttachment(this.file);
}

String _performedByLabel(String value) {
  switch (value) {
    case 'self':
      return 'Self-service';
    case 'repair_shop':
      return 'Repair shop';
    case 'dealership':
      return 'Dealership';
    case 'body_shop':
      return 'Body shop';
    case 'car_wash':
      return 'Car wash';
    case 'detailer':
      return 'Detailer';
    // Retired categories, kept for entries recorded before this taxonomy
    // shipped — new entries never write these.
    case 'business':
      return 'Business-maintained';
    case 'mechanic':
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
  final _mileageController = TextEditingController();
  String _performedBy = 'repair_shop';
  String _coverage = 'parts_and_labor';
  DateTime _entryDate = DateTime.now();
  bool _dateManuallySet = false;
  final DataExportService _exportService = DataExportService();
  final CalendarService _calendarService = CalendarService();
  final RecordStorageService _recordStorageService = RecordStorageService();
  final AttachmentAnalysisService _analysisService = AttachmentAnalysisService();
  final List<_PendingAttachment> _pendingAttachments = [];
  String? _draftEntryId;
  bool _saving = false;
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
    // Best-effort: any attachment uploaded while filling out the form but
    // never committed via _addEntry (navigated away, backgrounded) would
    // otherwise sit in Storage indefinitely with no Firestore doc ever
    // referencing it.
    for (final pending in _pendingAttachments) {
      final path = pending.uploaded?.path;
      if (path != null && path.isNotEmpty) {
        unawaited(_recordStorageService.deleteVehicleRecordFile(path));
      }
    }
    _titleController.dispose();
    _notesController.dispose();
    _costController.dispose();
    _providerNameController.dispose();
    _mileageController.dispose();
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
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            userFacingError(
              e,
              fallback: 'The vehicle could not be loaded. Please try again.',
            ),
          ),
        ),
      );
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
        SnackBar(
          content: Text(
            userFacingError(
              e,
              fallback:
                  'Maintenance entries could not be loaded. Please try again.',
            ),
          ),
        ),
      );
    }
  }

  Future<void> _pickPhoto() => _pickAndAttach(FileType.image);

  Future<void> _pickDocument() => _pickAndAttach(FileType.any);

  Future<void> _pickAndAttach(FileType type) async {
    final result = await FilePicker.platform.pickFiles(
      type: type,
      withData: true,
    );
    if (result == null || result.files.isEmpty) return;
    if (!mounted) return;

    final canAnalyze = context.read<PremiumService>().canAccessFeature(
      'ai_analysis',
    );
    final pending = _PendingAttachment(result.files.first)
      ..notEntitled = !canAnalyze;
    setState(() => _pendingAttachments.add(pending));

    try {
      final firestoreService = context.read<FirestoreService>();
      _draftEntryId ??= await firestoreService.reserveMaintenanceEntryId(
        widget.vin,
      );
      final entryId = _draftEntryId!;

      final uploadedMap = await _recordStorageService
          .uploadMaintenanceAttachment(widget.vin, entryId, pending.file);
      final uploadedPath = uploadedMap['path'].toString();

      AttachmentAnalysis? analysis;
      if (canAnalyze) {
        analysis = await _analyzeWithFallback(uploadedPath);
      }

      if (!mounted) return;
      setState(() {
        pending.uploaded = MaintenanceAttachment(
          path: uploadedMap['path'].toString(),
          url: uploadedMap['url'].toString(),
          name: uploadedMap['name'].toString(),
          type: uploadedMap['type'].toString(),
          size: (uploadedMap['size'] as num?)?.toInt() ?? pending.file.size,
          analysis: analysis,
        );
        pending.busy = false;
      });

      if (analysis != null) {
        _applyExtractedData(analysis.extracted);
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        pending.busy = false;
        pending.error = userFacingError(
          e,
          fallback: 'This attachment could not be uploaded.',
        );
      });
    }
  }

  // The synchronous callable can fail on a transient network error even
  // though the backend's passive Storage-finalize trigger still runs and
  // writes the same result to `attachmentAnalyses` independently — that
  // write doesn't depend on the maintenance doc existing (only the
  // separate array write-back does), so a delayed read there can recover
  // the result even for a not-yet-saved draft attachment. Best-effort: one
  // retry, then one delayed read; genuinely give up after that rather than
  // polling indefinitely.
  Future<AttachmentAnalysis?> _analyzeWithFallback(String path) async {
    try {
      return await _analysisService.analyze(widget.vin, path);
    } catch (_) {
      // Fall through to the read-based fallback below.
    }

    await Future.delayed(const Duration(seconds: 3));
    if (!mounted) return null;
    try {
      final firestoreService = context.read<FirestoreService>();
      final analyses = await firestoreService.getAttachmentAnalyses(
        widget.vin,
        [path],
      );
      final raw = analyses[path];
      return raw != null ? AttachmentAnalysis.fromMap(raw) : null;
    } catch (_) {
      return null;
    }
  }

  void _removePendingAttachment(_PendingAttachment pending) {
    setState(() => _pendingAttachments.remove(pending));
    final path = pending.uploaded?.path;
    if (path != null && path.isNotEmpty) {
      // Best-effort: the draft entry is never saved with this attachment
      // referenced, so an orphaned file isn't user-facing, but there's no
      // reason to leave it in Storage either.
      unawaited(_recordStorageService.deleteVehicleRecordFile(path));
    }
  }

  // Fills in form fields the user hasn't already provided a value for, from
  // whichever attachment's analysis resolves first. Never overwrites a
  // value the user already typed or a value a previous attachment already
  // supplied.
  void _applyExtractedData(AttachmentExtractedData extracted) {
    setState(() {
      if (_titleController.text.trim().isEmpty &&
          (extracted.serviceType?.trim().isNotEmpty ?? false)) {
        _titleController.text = extracted.serviceType!.trim();
      }
      if (_costController.text.trim().isEmpty && extracted.totalCost != null) {
        _costController.text = extracted.totalCost!.toStringAsFixed(2);
      }
      if (_mileageController.text.trim().isEmpty && extracted.mileage != null) {
        _mileageController.text = extracted.mileage!.toString();
      }
      if (!_dateManuallySet && extracted.serviceDate != null) {
        final parsed = DateTime.tryParse(extracted.serviceDate!);
        if (parsed != null) {
          _entryDate = parsed;
        }
      }
    });
  }

  Future<void> _selectEntryDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _entryDate,
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() {
        _entryDate = picked;
        _dateManuallySet = true;
      });
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

    if (_pendingAttachments.any((a) => a.busy)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please wait for attachments to finish uploading.'),
        ),
      );
      return;
    }

    setState(() => _saving = true);
    try {
      final firestoreService = context.read<FirestoreService>();
      final attachments = _pendingAttachments
          .map((a) => a.uploaded)
          .whereType<MaintenanceAttachment>()
          .toList();

      await firestoreService.addMaintenanceEntry(
        widget.vin,
        Maintenance(
          id: '', // Will be set by Firestore
          title: _titleController.text.trim(),
          notes: _notesController.text.trim(),
          mileage: _mileageController.text.trim(),
          cost: cost ?? 0.0,
          performedBy: _performedBy,
          providerName: _performedBy == 'self'
              ? ''
              : _providerNameController.text.trim(),
          coverage: _coverage,
          date: _entryDate,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
          attachments: attachments,
        ),
        id: _draftEntryId,
      );

      _titleController.clear();
      _notesController.clear();
      _costController.clear();
      _providerNameController.clear();
      _mileageController.clear();
      _performedBy = 'repair_shop';
      _coverage = 'parts_and_labor';
      _entryDate = DateTime.now();
      _dateManuallySet = false;
      _pendingAttachments.clear();
      _draftEntryId = null;

      await _loadEntries();

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Maintenance entry added')),
      );

      // Show interstitial ad after adding maintenance entry (only for non-premium users)
      final premiumService = context.read<PremiumService>();
      if (premiumService.shouldShowAds()) {
        InterstitialAdHelper.showAd();
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            userFacingError(
              e,
              fallback:
                  'The maintenance entry could not be saved. Please try again.',
            ),
          ),
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _saving = false);
      }
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
          SnackBar(
            content: Text(
              userFacingError(
                e,
                fallback:
                    'The CSV export could not be created. Please try again.',
              ),
            ),
          ),
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
          SnackBar(
            content: Text(
              userFacingError(
                e,
                fallback:
                    'The PDF export could not be created. Please try again.',
              ),
            ),
          ),
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
          SnackBar(
            content: Text(
              userFacingError(
                e,
                fallback:
                    'The Excel export could not be created. Please try again.',
              ),
            ),
          ),
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
            content: Text(
              userFacingError(
                e,
                fallback:
                    'Calendar events could not be added. Check permissions and try again.',
              ),
            ),
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
            icon: const Icon(Icons.insights_outlined),
            tooltip: 'Maintenance Insights',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) =>
                      MaintenanceInsightsScreen(vin: widget.vin),
                ),
              );
            },
          ),
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
      body: ListView(
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
                              value: 'repair_shop',
                              child: Text('Repair shop'),
                            ),
                            DropdownMenuItem(
                              value: 'dealership',
                              child: Text('Dealership'),
                            ),
                            DropdownMenuItem(
                              value: 'body_shop',
                              child: Text('Body shop'),
                            ),
                            DropdownMenuItem(
                              value: 'car_wash',
                              child: Text('Car wash'),
                            ),
                            DropdownMenuItem(
                              value: 'detailer',
                              child: Text('Detailer'),
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
                              labelText: 'Shop or professional',
                              hintText: 'e.g. Downtown Auto Repair',
                              border: OutlineInputBorder(),
                            ),
                          ),
                          Align(
                            alignment: Alignment.centerLeft,
                            child: TextButton.icon(
                              onPressed: () =>
                                  context.push('/app/service-providers'),
                              icon: const Icon(Icons.storefront_outlined),
                              label: const Text('Find shops & services'),
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
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _costController,
                          decoration: const InputDecoration(
                            labelText: 'Cost',
                            border: OutlineInputBorder(),
                            prefixText: '\$',
                          ),
                          keyboardType: TextInputType.number,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextField(
                          controller: _mileageController,
                          decoration: const InputDecoration(
                            labelText: 'Mileage',
                            border: OutlineInputBorder(),
                          ),
                          keyboardType: TextInputType.number,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Text('Date: '),
                      const SizedBox(width: 8),
                      Text(
                        '${_entryDate.day}/${_entryDate.month}/${_entryDate.year}',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      const Spacer(),
                      TextButton(
                        onPressed: _selectEntryDate,
                        child: const Text('Change Date'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Attachments',
                    style: Theme.of(context).textTheme.labelLarge,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Add a photo or receipt and we\'ll try to pre-fill the '
                    'cost, date, mileage, and title for you.',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const SizedBox(height: 8),
                  ..._pendingAttachments.map(
                    (pending) => _PendingAttachmentTile(
                      pending: pending,
                      onRemove: () => _removePendingAttachment(pending),
                    ),
                  ),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _pickPhoto,
                          icon: const Icon(Icons.add_a_photo_outlined),
                          label: const Text('Add Photo'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _pickDocument,
                          icon: const Icon(Icons.attach_file),
                          label: const Text('Add Document'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _saving ? null : _addEntry,
                    child: _saving
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Add Entry'),
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
          if (_loading)
            const Padding(
              padding: EdgeInsets.all(32),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_entries.isEmpty)
            const Padding(
              padding: EdgeInsets.fromLTRB(24, 16, 24, 32),
              child: Text(
                'No maintenance entries yet.\nAdd one using the form above.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 16, color: Colors.grey),
              ),
            )
          else
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
              itemCount: _entries.length,
              itemBuilder: (context, index) {
                final entry = _entries[index];
                final firstAttachment = entry.attachments.isNotEmpty
                    ? entry.attachments.first
                    : null;
                final isImageAttachment =
                    firstAttachment != null &&
                    const ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'gif']
                        .contains(firstAttachment.type.toLowerCase());
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: firstAttachment == null
                        ? null
                        : isImageAttachment
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(6),
                            child: Image.network(
                              firstAttachment.url,
                              width: 44,
                              height: 44,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) =>
                                  const Icon(Icons.build),
                            ),
                          )
                        : const Icon(Icons.description_outlined, size: 32),
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
                          'Cost: ${formatCurrencyAmount(entry.cost)} • ${entry.date.day}/${entry.date.month}/${entry.date.year}'
                          '${entry.attachments.length > 1 ? ' • ${entry.attachments.length} attachments' : ''}',
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
        ],
      ),
      bottomNavigationBar: const AppBottomNav(currentIndex: 0),
    );
  }
}

class _PendingAttachmentTile extends StatelessWidget {
  const _PendingAttachmentTile({required this.pending, required this.onRemove});

  final _PendingAttachment pending;
  final VoidCallback onRemove;

  static const _imageExtensions = [
    'jpg',
    'jpeg',
    'png',
    'webp',
    'heic',
    'heif',
    'gif',
  ];

  @override
  Widget build(BuildContext context) {
    final isImage = pending.file.extension != null &&
        _imageExtensions.contains(pending.file.extension!.toLowerCase());
    final extracted = pending.uploaded?.analysis?.extracted;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (isImage && pending.file.bytes != null)
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: Image.memory(
                  pending.file.bytes!,
                  width: 44,
                  height: 44,
                  fit: BoxFit.cover,
                ),
              )
            else
              const Icon(Icons.description_outlined, size: 36),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    pending.file.name,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  if (pending.busy)
                    const Padding(
                      padding: EdgeInsets.only(top: 4),
                      child: Row(
                        children: [
                          SizedBox(
                            width: 12,
                            height: 12,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                          SizedBox(width: 6),
                          Text('Uploading and analyzing…', style: TextStyle(fontSize: 12)),
                        ],
                      ),
                    )
                  else if (pending.error != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        pending.error!,
                        style: TextStyle(
                          fontSize: 12,
                          color: Theme.of(context).colorScheme.error,
                        ),
                      ),
                    )
                  else if (extracted != null && !extracted.isEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        'Detected: '
                        '${extracted.totalCost != null ? formatCurrencyAmount(extracted.totalCost!) : '—'}'
                        '${extracted.serviceDate != null ? ' • ${extracted.serviceDate}' : ''}'
                        '${extracted.serviceType != null ? ' • ${extracted.serviceType}' : ''}',
                        style: const TextStyle(
                          fontSize: 12,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    )
                  else if (!pending.busy && pending.error == null)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        pending.notEntitled
                            ? 'AI extraction requires Pro or Premium. The attachment is still saved.'
                            : 'No data could be extracted from this file.',
                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ),
                ],
              ),
            ),
            IconButton(
              tooltip: 'Remove attachment',
              onPressed: pending.busy ? null : onRemove,
              icon: const Icon(Icons.close),
            ),
          ],
        ),
      ),
    );
  }
}
