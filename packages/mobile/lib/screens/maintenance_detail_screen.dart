import 'dart:async';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../components/safe_back_button.dart';
import '../models/maintenance.dart';
import '../models/maintenance_attachment.dart';
import '../services/attachment_analysis_service.dart';
import '../services/firestore_service.dart';
import '../services/premium_service.dart';
import '../services/record_storage_service.dart';
import '../utils/number_format.dart';
import '../utils/user_facing_error.dart';

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

// A DropdownButtonFormField requires its current value to appear in `items`.
// Entries saved before this taxonomy shipped may still carry a retired
// 'mechanic'/'business' value, so it's appended here (labeled as legacy)
// only when that's the value actually loaded — new entries never see it.
List<DropdownMenuItem<String>> _performedByItems(String currentValue) {
  final items = <DropdownMenuItem<String>>[
    const DropdownMenuItem(value: 'self', child: Text('Self-service')),
    const DropdownMenuItem(value: 'repair_shop', child: Text('Repair shop')),
    const DropdownMenuItem(value: 'dealership', child: Text('Dealership')),
    const DropdownMenuItem(value: 'body_shop', child: Text('Body shop')),
    const DropdownMenuItem(value: 'car_wash', child: Text('Car wash')),
    const DropdownMenuItem(value: 'detailer', child: Text('Detailer')),
  ];
  if (currentValue == 'mechanic' || currentValue == 'business') {
    items.add(
      DropdownMenuItem(
        value: currentValue,
        child: Text('${_performedByLabel(currentValue)} (legacy)'),
      ),
    );
  }
  return items;
}

String _coverageLabel(String value) {
  switch (value) {
    case 'parts_only':
      return 'Parts only';
    default:
      return 'Parts and labor';
  }
}

class MaintenanceDetailScreen extends StatefulWidget {
  final String vin;
  final String entryId;

  const MaintenanceDetailScreen({
    super.key,
    required this.vin,
    required this.entryId,
  });

  @override
  State<MaintenanceDetailScreen> createState() =>
      _MaintenanceDetailScreenState();
}

class _MaintenanceDetailScreenState extends State<MaintenanceDetailScreen> {
  final _titleController = TextEditingController();
  final _notesController = TextEditingController();
  final _costController = TextEditingController();
  final _providerNameController = TextEditingController();
  final _mileageController = TextEditingController();
  String _performedBy = 'repair_shop';
  String _coverage = 'parts_and_labor';
  final RecordStorageService _recordStorageService = RecordStorageService();
  final AttachmentAnalysisService _analysisService = AttachmentAnalysisService();
  Maintenance? _entry;
  bool _loading = true;
  bool _attachmentBusy = false;
  DateTime _selectedDate = DateTime.now();
  bool _dateManuallySet = false;

  @override
  void initState() {
    super.initState();
    _loadEntry();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _notesController.dispose();
    _costController.dispose();
    _providerNameController.dispose();
    _mileageController.dispose();
    super.dispose();
  }

  Future<void> _loadEntry() async {
    setState(() => _loading = true);
    try {
      final firestoreService = context.read<FirestoreService>();
      final entry = await firestoreService.getMaintenanceEntry(
        widget.vin,
        widget.entryId,
      );

      if (entry != null) {
        setState(() {
          _entry = entry;
          _titleController.text = entry.title;
          _notesController.text = entry.notes;
          _costController.text = entry.cost.toString();
          _mileageController.text = entry.mileage;
          _performedBy = entry.performedBy;
          _providerNameController.text = entry.providerName;
          _coverage = entry.coverage;
          _selectedDate = entry.date;
          // A real, already-known date on the loaded entry counts as
          // user-provided for extraction's don't-overwrite rule, same as
          // cost/mileage (whose loaded controllers are simply non-empty).
          // A fabricated date (hasKnownDate == false, e.g. a legacy record
          // with no real date) is legitimately fair game for an attached
          // receipt to fill in.
          _dateManuallySet = entry.hasKnownDate;
          _loading = false;
        });
      } else {
        if (mounted) {
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Maintenance entry not found')),
          );
        }
      }
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              userFacingError(
                e,
                fallback:
                    'The maintenance entry could not be loaded. Please try again.',
              ),
            ),
          ),
        );
      }
    }
  }

  Future<void> _saveEntry() async {
    if (_titleController.text.trim().isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Title is required')));
      return;
    }

    final costText = _costController.text.trim();
    double cost = 0.0;
    if (costText.isNotEmpty) {
      final parsed = double.tryParse(costText);
      if (parsed == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Cost must be a valid number')),
        );
        return;
      }
      cost = parsed;
    }

    if (_entry == null) return;

    try {
      final firestoreService = context.read<FirestoreService>();
      final updatedEntry = _entry!.copyWith(
        title: _titleController.text.trim(),
        notes: _notesController.text.trim(),
        mileage: _mileageController.text.trim(),
        cost: cost,
        performedBy: _performedBy,
        providerName: _performedBy == 'self'
            ? ''
            : _providerNameController.text.trim(),
        coverage: _coverage,
        date: _selectedDate,
        updatedAt: DateTime.now(),
      );

      await firestoreService.updateMaintenanceEntry(
        widget.vin,
        widget.entryId,
        updatedEntry,
      );

      if (mounted) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Maintenance entry updated')),
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
                    'The maintenance entry could not be updated. Please try again.',
              ),
            ),
          ),
        );
      }
    }
  }

  Future<void> _deleteEntry() async {
    final firestoreService = context.read<FirestoreService>();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Entry'),
        content: const Text(
          'Are you sure you want to delete this maintenance entry?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(
              foregroundColor: Theme.of(context).colorScheme.error,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await firestoreService.deleteMaintenanceEntry(
          widget.vin,
          widget.entryId,
        );

        // Best-effort: the entry doc is already gone regardless of whether
        // these succeed, so failures here aren't user-facing — but leaving
        // the files behind would otherwise retain user documents (photos,
        // receipts) indefinitely with no remaining reference to them.
        for (final attachment in _entry?.attachments ?? const []) {
          unawaited(
            _recordStorageService.deleteVehicleRecordFile(attachment.path),
          );
        }

        if (mounted) {
          final navigator = Navigator.of(context);
          navigator.pop(); // Go back to maintenance list
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                userFacingError(
                  e,
                  fallback:
                      'The maintenance entry could not be deleted. Please try again.',
                ),
              ),
            ),
          );
        }
      }
    }
  }

  Future<void> _pickPhoto() => _pickAndUploadAttachment(FileType.image);

  Future<void> _pickDocument() => _pickAndUploadAttachment(FileType.any);

  Future<void> _pickAndUploadAttachment(FileType type) async {
    if (_entry == null) return;

    final result = await FilePicker.platform.pickFiles(
      type: type,
      withData: true,
    );
    if (result == null || result.files.isEmpty) return;
    if (!mounted) return;

    final canAnalyze = context.read<PremiumService>().canAccessFeature(
      'ai_analysis',
    );

    setState(() => _attachmentBusy = true);
    try {
      final firestoreService = context.read<FirestoreService>();

      final uploadedMap = await _recordStorageService
          .uploadMaintenanceAttachment(
            widget.vin,
            widget.entryId,
            result.files.first,
          );
      final uploadedPath = uploadedMap['path'].toString();

      AttachmentAnalysis? analysis;
      if (canAnalyze) {
        analysis = await _analyzeWithFallback(uploadedPath);
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'AI extraction requires Pro or Premium. The attachment is still saved.',
            ),
          ),
        );
      }

      final attachment = MaintenanceAttachment(
        path: uploadedMap['path'].toString(),
        url: uploadedMap['url'].toString(),
        name: uploadedMap['name'].toString(),
        type: uploadedMap['type'].toString(),
        size: (uploadedMap['size'] as num?)?.toInt() ?? 0,
        analysis: analysis,
      );

      final updated = _entry!.copyWith(
        attachments: [..._entry!.attachments, attachment],
        updatedAt: DateTime.now(),
      );
      await firestoreService.updateMaintenanceEntry(
        widget.vin,
        widget.entryId,
        updated,
      );

      if (!mounted) return;
      setState(() => _entry = updated);

      if (analysis != null) {
        _applyExtractedData(analysis.extracted);
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            userFacingError(
              e,
              fallback:
                  'This attachment could not be uploaded. Please try again.',
            ),
          ),
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _attachmentBusy = false);
      }
    }
  }

  // See the matching comment in maintenance_list_screen — the backend's
  // passive Storage-finalize trigger writes to `attachmentAnalyses`
  // independently of the synchronous callable, so a delayed read can
  // recover a result the direct call failed to get.
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

  Future<void> _removeAttachment(MaintenanceAttachment attachment) async {
    if (_entry == null) return;

    setState(() => _attachmentBusy = true);
    try {
      final firestoreService = context.read<FirestoreService>();
      final updated = _entry!.copyWith(
        attachments: _entry!.attachments
            .where((a) => a.path != attachment.path)
            .toList(),
        updatedAt: DateTime.now(),
      );
      await firestoreService.updateMaintenanceEntry(
        widget.vin,
        widget.entryId,
        updated,
      );

      unawaited(_recordStorageService.deleteVehicleRecordFile(attachment.path));

      if (!mounted) return;
      setState(() => _entry = updated);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            userFacingError(
              e,
              fallback:
                  'The attachment could not be removed. Please try again.',
            ),
          ),
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _attachmentBusy = false);
      }
    }
  }

  // Mirrors maintenance_list_screen's rule: only fills fields the user
  // hasn't already given a value, so attaching a receipt to an entry you're
  // mid-edit-on never silently overwrites what you already typed.
  void _applyExtractedData(AttachmentExtractedData extracted) {
    setState(() {
      if (_costController.text.trim().isEmpty && extracted.totalCost != null) {
        _costController.text = extracted.totalCost!.toStringAsFixed(2);
      }
      if (_mileageController.text.trim().isEmpty && extracted.mileage != null) {
        _mileageController.text = extracted.mileage!.toString();
      }
      if (!_dateManuallySet && extracted.serviceDate != null) {
        final parsed = DateTime.tryParse(extracted.serviceDate!);
        if (parsed != null) {
          _selectedDate = parsed;
        }
      }
    });
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
    );

    if (picked != null) {
      setState(() {
        _selectedDate = picked;
        _dateManuallySet = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Maintenance'),
        leading: SafeBackButton(
          fallbackRoute: '/app/maintenance/${widget.vin}',
        ),
        actions: [
          IconButton(icon: const Icon(Icons.delete), onPressed: _deleteEntry),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextField(
                    controller: _titleController,
                    decoration: const InputDecoration(
                      labelText: 'Title *',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _notesController,
                    decoration: const InputDecoration(
                      labelText: 'Notes',
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 4,
                  ),
                  const SizedBox(height: 16),
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
                          items: _performedByItems(_performedBy),
                          onChanged: (value) {
                            if (value == null) return;
                            setState(() => _performedBy = value);
                          },
                        ),
                        if (_performedBy != 'self') ...[
                          const SizedBox(height: 16),
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
                        const SizedBox(height: 16),
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
                  const SizedBox(height: 16),
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
                  TextField(
                    controller: _mileageController,
                    decoration: const InputDecoration(
                      labelText: 'Mileage',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    _providerNameController.text.trim().isNotEmpty
                        ? '${_performedByLabel(_performedBy)} (${_providerNameController.text.trim()}) • ${_coverageLabel(_coverage)}'
                        : '${_performedByLabel(_performedBy)} • ${_coverageLabel(_coverage)}',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Attachments',
                    style: Theme.of(context).textTheme.labelLarge,
                  ),
                  const SizedBox(height: 8),
                  ...?_entry?.attachments.map(
                    (attachment) => _AttachmentTile(
                      attachment: attachment,
                      busy: _attachmentBusy,
                      onRemove: () => _removeAttachment(attachment),
                      onOpen: () => _recordStorageService.openVehicleRecordFile(
                        attachment.url,
                      ),
                    ),
                  ),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _attachmentBusy ? null : _pickPhoto,
                          icon: const Icon(Icons.add_a_photo_outlined),
                          label: const Text('Add Photo'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _attachmentBusy ? null : _pickDocument,
                          icon: const Icon(Icons.attach_file),
                          label: const Text('Add Document'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      const Text('Date: '),
                      const SizedBox(width: 8),
                      Text(
                        '${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      const Spacer(),
                      TextButton(
                        onPressed: _selectDate,
                        child: const Text('Change Date'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),
                  ElevatedButton(
                    onPressed: _saveEntry,
                    child: const Text('Save Changes'),
                  ),
                ],
              ),
            ),
    );
  }
}

class _AttachmentTile extends StatelessWidget {
  const _AttachmentTile({
    required this.attachment,
    required this.busy,
    required this.onRemove,
    required this.onOpen,
  });

  final MaintenanceAttachment attachment;
  final bool busy;
  final VoidCallback onRemove;
  final VoidCallback onOpen;

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
    final isImage = _imageExtensions.contains(attachment.type.toLowerCase());
    final extracted = attachment.analysis?.extracted;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        onTap: onOpen,
        leading: isImage
            ? ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: Image.network(
                  attachment.url,
                  width: 44,
                  height: 44,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) =>
                      const Icon(Icons.broken_image_outlined),
                ),
              )
            : const Icon(Icons.description_outlined, size: 32),
        title: Text(attachment.name, overflow: TextOverflow.ellipsis),
        subtitle: extracted != null && !extracted.isEmpty
            ? Text(
                'Detected: '
                '${extracted.totalCost != null ? formatCurrencyAmount(extracted.totalCost!) : '—'}'
                '${extracted.serviceDate != null ? ' • ${extracted.serviceDate}' : ''}'
                '${extracted.serviceType != null ? ' • ${extracted.serviceType}' : ''}'
                '${attachment.analysis != null ? ' • ${(attachment.analysis!.confidence * 100).round()}% confidence' : ''}',
                style: const TextStyle(fontSize: 12, fontStyle: FontStyle.italic),
              )
            : const Text(
                'No data extracted from this file.',
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
        trailing: IconButton(
          tooltip: 'Remove attachment',
          onPressed: busy ? null : onRemove,
          icon: const Icon(Icons.close),
        ),
      ),
    );
  }
}
