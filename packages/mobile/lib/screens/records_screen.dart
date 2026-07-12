import 'dart:async';

import 'package:cloud_functions/cloud_functions.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../components/app_bottom_nav.dart';
import '../models/vehicle.dart';
import '../services/firestore_service.dart';
import '../services/record_storage_service.dart';
import '../theme/design_tokens.dart';
import '../utils/ownership_insights.dart';
import 'record_category_screen.dart';

class RecordsScreen extends StatefulWidget {
  const RecordsScreen({super.key, required this.vin});

  final String vin;

  @override
  State<RecordsScreen> createState() => _RecordsScreenState();
}

class _RecordsScreenState extends State<RecordsScreen> {
  final _firestoreService = FirestoreService();
  final _recordStorageService = RecordStorageService();
  bool _isLoading = true;
  bool _isSaving = false;
  String? _uploadingKey;
  final Map<String, List<PlatformFile>> _failedUploadsByKey = {};
  Vehicle? _vehicle;
  Map<String, dynamic>? _portfolio;
  Map<String, Map<String, dynamic>> _analysisByPath = {};

  @override
  void initState() {
    super.initState();
    _loadVehicle();
  }

  Future<void> _loadVehicle() async {
    try {
      final vehicle = await _firestoreService.getVehicle(widget.vin);
      if (!mounted) {
        return;
      }

      if (vehicle == null) {
        context.go('/app');
        return;
      }

      setState(() {
        _vehicle = vehicle;
        _portfolio = Map<String, dynamic>.from(vehicle.documentPortfolio ?? {});
        _isLoading = false;
      });

      unawaited(_refreshAnalyses(_allFilePaths()));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error loading records: ${e.toString()}'),
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
      context.go('/app');
    }
  }

  List<dynamic> get _categories => (_portfolio?['categories'] as List?) ?? [];

  List<String> _allFilePaths() {
    final paths = <String>[];
    for (final category in _categories) {
      final categoryMap = Map<String, dynamic>.from(category as Map);
      final items = (categoryMap['items'] as List?) ?? [];
      for (final item in items) {
        final itemMap = Map<String, dynamic>.from(item as Map);
        final files = (itemMap['files'] as List?) ?? [];
        for (final file in files) {
          final fileMap = Map<String, dynamic>.from(file as Map);
          final path = (fileMap['path'] ?? '').toString();
          if (path.isNotEmpty) paths.add(path);
        }
      }
    }
    return paths;
  }

  // Portfolio category key (e.g. 'maintenance', 'finance', 'ownership') each
  // file path was filed under — needed so ownership-insight spend
  // classification reflects where the user filed the document, not the AI's
  // generic per-file documentCategory tag (see ownership_insights.dart).
  Map<String, String> _pathCategoryKeys() {
    final result = <String, String>{};
    for (final category in _categories) {
      final categoryMap = Map<String, dynamic>.from(category as Map);
      final categoryKey = (categoryMap['key'] ?? '').toString();
      final items = (categoryMap['items'] as List?) ?? [];
      for (final item in items) {
        final itemMap = Map<String, dynamic>.from(item as Map);
        final files = (itemMap['files'] as List?) ?? [];
        for (final file in files) {
          final fileMap = Map<String, dynamic>.from(file as Map);
          final path = (fileMap['path'] ?? '').toString();
          if (path.isNotEmpty) result[path] = categoryKey;
        }
      }
    }
    return result;
  }

  Future<void> _refreshAnalyses(List<String> paths) async {
    if (paths.isEmpty) return;
    try {
      final analyses = await _firestoreService.getAttachmentAnalyses(
        widget.vin,
        paths,
      );
      if (!mounted || analyses.isEmpty) return;
      setState(() {
        _analysisByPath = {..._analysisByPath, ...analyses};
      });
    } catch (_) {
      // Non-fatal: render without analysis enrichment.
    }
  }

  Future<void> _requestAnalysis(String path) async {
    try {
      await FirebaseFunctions.instance
          .httpsCallable('analyzeAttachmentTextCallable')
          .call({'vin': widget.vin, 'storagePath': path});
    } catch (_) {
      // Non-fatal: the storage-finalize trigger will analyze it regardless.
    }
    await _refreshAnalyses([path]);
  }

  String _itemUploadKey(int categoryIndex, int itemIndex) =>
      '$categoryIndex:$itemIndex';

  void _updateItemField(
    int categoryIndex,
    int itemIndex,
    String field,
    dynamic value,
  ) {
    final nextPortfolio = Map<String, dynamic>.from(_portfolio ?? {});
    final nextCategories = List<Map<String, dynamic>>.from(
      _categories.map((category) => Map<String, dynamic>.from(category as Map)),
    );
    final nextItems = List<Map<String, dynamic>>.from(
      (nextCategories[categoryIndex]['items'] as List).map(
        (item) => Map<String, dynamic>.from(item as Map),
      ),
    );

    nextItems[itemIndex][field] = value;
    nextCategories[categoryIndex]['items'] = nextItems;
    nextPortfolio['categories'] = nextCategories;

    setState(() {
      _portfolio = nextPortfolio;
    });
  }

  List<Map<String, dynamic>> _itemFiles(int categoryIndex, int itemIndex) {
    final category = Map<String, dynamic>.from(
      _categories[categoryIndex] as Map,
    );
    final items = (category['items'] as List?) ?? [];
    final item = Map<String, dynamic>.from(items[itemIndex] as Map);
    return List<Map<String, dynamic>>.from(
      ((item['files'] as List?) ?? []).map(
        (file) => Map<String, dynamic>.from(file as Map),
      ),
    );
  }

  void _appendItemFile(
    int categoryIndex,
    int itemIndex,
    Map<String, dynamic> file,
  ) {
    final existingFiles = _itemFiles(categoryIndex, itemIndex);
    _updateItemField(categoryIndex, itemIndex, 'files', [
      ...existingFiles,
      file,
    ]);
  }

  Future<void> _removeItemFile(
    int categoryIndex,
    int itemIndex,
    int fileIndex,
  ) async {
    final files = _itemFiles(categoryIndex, itemIndex);
    if (fileIndex < 0 || fileIndex >= files.length) return;
    final file = files[fileIndex];

    try {
      final path = (file['path'] ?? '').toString();
      if (path.isNotEmpty) {
        await _recordStorageService.deleteVehicleRecordFile(path);
      }
      final nextFiles = [...files]..removeAt(fileIndex);
      _updateItemField(categoryIndex, itemIndex, 'files', nextFiles);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error deleting attachment: ${e.toString()}'),
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
    }
  }

  Future<void> _openItemFile(
    int categoryIndex,
    int itemIndex,
    int fileIndex,
  ) async {
    final files = _itemFiles(categoryIndex, itemIndex);
    if (fileIndex < 0 || fileIndex >= files.length) return;

    final file = files[fileIndex];
    final url = (file['url'] ?? '').toString();
    if (url.isEmpty) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Attachment URL is missing'),
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
      return;
    }

    try {
      await _recordStorageService.openVehicleRecordFile(url);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error opening attachment: ${e.toString()}'),
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
    }
  }

  Future<void> _pickAndUploadFiles(int categoryIndex, int itemIndex) async {
    if (_uploadingKey != null) {
      return;
    }

    final category = Map<String, dynamic>.from(
      _categories[categoryIndex] as Map,
    );
    final items = (category['items'] as List?) ?? [];
    final item = Map<String, dynamic>.from(items[itemIndex] as Map);
    final uploadKey = _itemUploadKey(categoryIndex, itemIndex);

    try {
      setState(() => _uploadingKey = uploadKey);
      final result = await FilePicker.platform.pickFiles(
        allowMultiple: true,
        withData: true,
      );
      if (result == null || result.files.isEmpty) {
        return;
      }

      final failedFiles = <PlatformFile>[];
      var uploadedCount = 0;

      for (final file in result.files) {
        try {
          final uploaded = await _recordStorageService.uploadVehicleRecordFile(
            widget.vin,
            (item['id'] ?? '').toString(),
            file,
          );
          _appendItemFile(categoryIndex, itemIndex, uploaded);
          uploadedCount += 1;
          final uploadedPath = (uploaded['path'] ?? '').toString();
          if (uploadedPath.isNotEmpty) {
            unawaited(_requestAnalysis(uploadedPath));
          }
        } catch (_) {
          failedFiles.add(file);
        }
      }

      if (!mounted) return;

      setState(() {
        if (failedFiles.isNotEmpty) {
          _failedUploadsByKey[uploadKey] = failedFiles;
        } else {
          _failedUploadsByKey.remove(uploadKey);
        }
      });

      final hasFailures = failedFiles.isNotEmpty;
      final uploadedLabel =
          '$uploadedCount attachment${uploadedCount == 1 ? '' : 's'} uploaded';
      final failedLabel = hasFailures
          ? ', ${failedFiles.length} attachment${failedFiles.length == 1 ? '' : 's'} failed'
          : '';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Upload summary: $uploadedLabel$failedLabel.'),
          backgroundColor: hasFailures
              ? Theme.of(context).colorScheme.tertiary
              : AppDesignTokens.success,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error selecting attachments: ${e.toString()}'),
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _uploadingKey = null);
      }
    }
  }

  Future<void> _retryFailedUploads(int categoryIndex, int itemIndex) async {
    if (_uploadingKey != null) {
      return;
    }

    final uploadKey = _itemUploadKey(categoryIndex, itemIndex);
    final files = _failedUploadsByKey[uploadKey];
    if (files == null || files.isEmpty) {
      return;
    }

    final category = Map<String, dynamic>.from(
      _categories[categoryIndex] as Map,
    );
    final items = (category['items'] as List?) ?? [];
    final item = Map<String, dynamic>.from(items[itemIndex] as Map);

    setState(() => _uploadingKey = uploadKey);

    try {
      final stillFailing = <PlatformFile>[];
      var recoveredCount = 0;

      for (final file in files) {
        try {
          final uploaded = await _recordStorageService.uploadVehicleRecordFile(
            widget.vin,
            (item['id'] ?? '').toString(),
            file,
          );
          _appendItemFile(categoryIndex, itemIndex, uploaded);
          recoveredCount += 1;
          final uploadedPath = (uploaded['path'] ?? '').toString();
          if (uploadedPath.isNotEmpty) {
            unawaited(_requestAnalysis(uploadedPath));
          }
        } catch (_) {
          stillFailing.add(file);
        }
      }

      if (!mounted) return;

      setState(() {
        if (stillFailing.isNotEmpty) {
          _failedUploadsByKey[uploadKey] = stillFailing;
        } else {
          _failedUploadsByKey.remove(uploadKey);
        }
      });

      final recoveredLabel =
          '$recoveredCount attachment${recoveredCount == 1 ? '' : 's'} recovered';
      final remainingLabel = stillFailing.isNotEmpty
          ? ', ${stillFailing.length} attachment${stillFailing.length == 1 ? '' : 's'} still failing'
          : '';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Retry summary: $recoveredLabel$remainingLabel.'),
          backgroundColor: stillFailing.isEmpty
              ? AppDesignTokens.success
              : Theme.of(context).colorScheme.tertiary,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Retry failed: ${e.toString()}'),
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _uploadingKey = null);
      }
    }
  }

  Future<void> _save() async {
    if (_vehicle == null || _portfolio == null) return;

    setState(() => _isSaving = true);
    try {
      final updatedVehicle = _vehicle!.copyWith(documentPortfolio: _portfolio);
      await _firestoreService.addOrUpdateVehicle(updatedVehicle);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Records updated successfully!'),
          backgroundColor: AppDesignTokens.success,
        ),
      );
      context.go('/app');
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error saving records: ${e.toString()}'),
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  ({int requiredCount, int readyRequiredCount, int totalFiles}) _categoryStats(
    Map<String, dynamic> category,
  ) {
    final items = (category['items'] as List?) ?? [];
    var requiredCount = 0;
    var readyRequiredCount = 0;
    var totalFiles = 0;
    for (final item in items) {
      final itemMap = Map<String, dynamic>.from(item as Map);
      if (itemMap['required'] == true) {
        requiredCount += 1;
        if (itemMap['status'] == 'ready') {
          readyRequiredCount += 1;
        }
      }
      totalFiles += ((itemMap['files'] as List?) ?? []).length;
    }
    return (
      requiredCount: requiredCount,
      readyRequiredCount: readyRequiredCount,
      totalFiles: totalFiles,
    );
  }

  void _openCategory(int categoryIndex) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => RecordCategoryScreen(
          categoryIndex: categoryIndex,
          categoryTitle:
              (Map<String, dynamic>.from(
                        _categories[categoryIndex] as Map,
                      )['title'] ??
                      '')
                  .toString(),
          getCategory: () =>
              Map<String, dynamic>.from(_categories[categoryIndex] as Map),
          getUploadingKey: () => _uploadingKey,
          getFailedUploads: (key) => _failedUploadsByKey[key],
          getAnalysis: (path) => _analysisByPath[path],
          itemFiles: _itemFiles,
          itemUploadKey: _itemUploadKey,
          onUpdateItemField: _updateItemField,
          onPickAndUpload: _pickAndUploadFiles,
          onRetryFailedUploads: _retryFailedUploads,
          onOpenItemFile: _openItemFile,
          onRemoveItemFile: _removeItemFile,
        ),
      ),
    ).then((_) => setState(() {}));
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    var requiredCount = 0;
    var completeCount = 0;
    for (final category in _categories) {
      final categoryMap = Map<String, dynamic>.from(category as Map);
      final items = (categoryMap['items'] as List?) ?? [];
      for (final item in items) {
        final itemMap = Map<String, dynamic>.from(item as Map);
        if (itemMap['required'] == true) {
          requiredCount += 1;
          if (itemMap['status'] == 'ready') {
            completeCount += 1;
          }
        }
      }
    }

    final hasUploadInFlight = _uploadingKey != null;
    final pendingFailedUploads = _failedUploadsByKey.values.fold<int>(
      0,
      (count, files) => count + files.length,
    );

    final pathCategoryKeys = _pathCategoryKeys();
    final allFiles = <Map<String, dynamic>>[];
    for (final path in _allFilePaths()) {
      final analysis = _analysisByPath[path];
      if (analysis != null) {
        allFiles.add({
          'path': path,
          'analysis': analysis,
          'categoryKey': pathCategoryKeys[path],
        });
      }
    }
    final insights = computeOwnershipInsights(
      allFiles,
      vehicleYear: _vehicle?.year,
    );

    return Scaffold(
      appBar: AppBar(title: const Text('Vehicle Records')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Align(
              alignment: Alignment.centerLeft,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${_vehicle?.year} ${_vehicle?.make} ${_vehicle?.model}',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 4),
                  Text('VIN: ${_vehicle?.vin}'),
                  const SizedBox(height: 4),
                  Text(
                    'Required records complete: $completeCount/$requiredCount',
                  ),
                  if (hasUploadInFlight) ...[
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.blue.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        'Upload in progress. Please wait before saving.',
                        style: TextStyle(
                          color: Colors.blue,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                  if (pendingFailedUploads > 0) ...[
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Theme.of(
                          context,
                        ).colorScheme.tertiary.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '$pendingFailedUploads failed upload${pendingFailedUploads == 1 ? '' : 's'} pending retry.',
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.tertiary,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            if (insights.hasAnyInsight) ...[
              const SizedBox(height: 12),
              _OwnershipInsightsPanel(insights: insights),
            ],
            const SizedBox(height: 16),
            Expanded(
              child: ListView.builder(
                itemCount: _categories.length,
                itemBuilder: (context, categoryIndex) {
                  final category = Map<String, dynamic>.from(
                    _categories[categoryIndex] as Map,
                  );
                  final stats = _categoryStats(category);
                  final isComplete =
                      stats.requiredCount > 0 &&
                      stats.readyRequiredCount == stats.requiredCount;
                  final hasProgress =
                      stats.readyRequiredCount > 0 || stats.totalFiles > 0;
                  final colorScheme = Theme.of(context).colorScheme;
                  final statusColor = isComplete
                      ? AppDesignTokens.success
                      : hasProgress
                      ? colorScheme.tertiary
                      : Colors.grey;
                  final statusIcon = isComplete
                      ? Icons.check_circle
                      : hasProgress
                      ? Icons.hourglass_bottom
                      : Icons.radio_button_unchecked;

                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: ListTile(
                      onTap: () => _openCategory(categoryIndex),
                      leading: Icon(statusIcon, color: statusColor),
                      title: Text(
                        (category['title'] ?? '').toString(),
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      subtitle: Text(
                        stats.requiredCount > 0
                            ? '${stats.readyRequiredCount}/${stats.requiredCount} required ready'
                                  '${stats.totalFiles > 0 ? ' • ${stats.totalFiles} file${stats.totalFiles == 1 ? '' : 's'}' : ''}'
                            : stats.totalFiles > 0
                            ? '${stats.totalFiles} file${stats.totalFiles == 1 ? '' : 's'}'
                            : 'No records yet',
                      ),
                      trailing: const Icon(Icons.chevron_right),
                    ),
                  );
                },
              ),
            ),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isSaving || hasUploadInFlight ? null : _save,
                child: _isSaving
                    ? const CircularProgressIndicator(color: Colors.white)
                    : hasUploadInFlight
                    ? const Text('Complete uploads to save')
                    : const Text('Save Records'),
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: const AppBottomNav(currentIndex: 0),
    );
  }
}

class _OwnershipInsightsPanel extends StatelessWidget {
  const _OwnershipInsightsPanel({required this.insights});

  final OwnershipInsights insights;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          leading: const Icon(Icons.insights, size: 18),
          title: Text(
            'Ownership Insights',
            style: Theme.of(context).textTheme.titleSmall,
          ),
          childrenPadding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
          expandedCrossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Documents analyzed: ${insights.analyzedDocumentCount}',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 8),
            Text(
              'Maintenance spend captured: \$${insights.maintenanceTotalCost.toStringAsFixed(2)}',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            Text(
              '${insights.maintenanceDocsCount} doc${insights.maintenanceDocsCount == 1 ? '' : 's'}'
              ' • Avg \$${insights.maintenanceAverageCost.toStringAsFixed(2)}'
              '${insights.latestServiceDate != null ? ' • Latest ${insights.latestServiceDate}' : ''}',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 2),
            Text(
              'From docs filed under Maintenance and Repair only — purchase '
              'price and finance documents are excluded.',
              style: TextStyle(
                fontSize: 11,
                color: Theme.of(context).colorScheme.outline,
              ),
            ),
            if (insights.maintenanceBreakdown.isNotEmpty) ...[
              const SizedBox(height: 10),
              Text(
                'SPEND BY SERVICE TYPE',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.5,
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 6),
              ...insights.maintenanceBreakdown.map((entry) {
                final fraction = insights.maintenanceTotalCost > 0
                    ? (entry.amount / insights.maintenanceTotalCost).clamp(
                        0.0,
                        1.0,
                      )
                    : 0.0;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 90,
                        child: Text(
                          entry.label,
                          style: Theme.of(context).textTheme.bodySmall,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(3),
                          child: LinearProgressIndicator(
                            value: fraction,
                            minHeight: 6,
                            backgroundColor: Theme.of(
                              context,
                            ).colorScheme.surfaceContainerHighest,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      SizedBox(
                        width: 56,
                        child: Text(
                          '\$${entry.amount.toStringAsFixed(0)}',
                          textAlign: TextAlign.right,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }),
            ],
            const SizedBox(height: 8),
            Text(
              insights.estimatedMonthlyPayment != null
                  ? 'Estimated monthly payment: \$${insights.estimatedMonthlyPayment!.toStringAsFixed(2)}'
                  : 'Estimated monthly payment: add finance docs',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            Text(
              'Finance docs detected: ${insights.financeDocsCount}',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            if (insights.estimatedValueRealized != null) ...[
              const SizedBox(height: 8),
              Text(
                'Estimated value realized: \$${insights.estimatedValueRealized!.toStringAsFixed(2)}',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              if (insights.estimatedCurrentValue != null)
                Text(
                  'Est. current value \$${insights.estimatedCurrentValue!.toStringAsFixed(2)}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
            ],
          ],
        ),
      ),
    );
  }
}
