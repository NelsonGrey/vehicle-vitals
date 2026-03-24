import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../components/app_bottom_nav.dart';
import '../models/vehicle.dart';
import '../services/firestore_service.dart';
import '../services/record_storage_service.dart';

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
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error loading records: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
      context.go('/app');
    }
  }

  List<dynamic> get _categories => (_portfolio?['categories'] as List?) ?? [];

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
          backgroundColor: Colors.red,
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
        const SnackBar(
          content: Text('Attachment URL is missing'),
          backgroundColor: Colors.red,
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
          backgroundColor: Colors.red,
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
          backgroundColor: hasFailures ? Colors.orange : Colors.green,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error selecting attachments: ${e.toString()}'),
          backgroundColor: Colors.red,
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
          backgroundColor: stillFailing.isEmpty ? Colors.green : Colors.orange,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Retry failed: ${e.toString()}'),
          backgroundColor: Colors.red,
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
          backgroundColor: Colors.green,
        ),
      );
      context.go('/app');
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error saving records: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
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
                        color: Colors.orange.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '$pendingFailedUploads failed upload${pendingFailedUploads == 1 ? '' : 's'} pending retry.',
                        style: const TextStyle(
                          color: Colors.orange,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: ListView.builder(
                itemCount: _categories.length,
                itemBuilder: (context, categoryIndex) {
                  final category = Map<String, dynamic>.from(
                    _categories[categoryIndex] as Map,
                  );
                  final items = (category['items'] as List?) ?? [];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            (category['title'] ?? '').toString(),
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 12),
                          ...List.generate(items.length, (itemIndex) {
                            final item = Map<String, dynamic>.from(
                              items[itemIndex] as Map,
                            );
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    (item['title'] ?? '').toString(),
                                    style: Theme.of(
                                      context,
                                    ).textTheme.titleSmall,
                                  ),
                                  const SizedBox(height: 4),
                                  Text((item['description'] ?? '').toString()),
                                  const SizedBox(height: 8),
                                  DropdownButtonFormField<String>(
                                    initialValue: (item['status'] ?? 'missing')
                                        .toString(),
                                    items: const [
                                      DropdownMenuItem(
                                        value: 'missing',
                                        child: Text('Missing'),
                                      ),
                                      DropdownMenuItem(
                                        value: 'in-progress',
                                        child: Text('In Progress'),
                                      ),
                                      DropdownMenuItem(
                                        value: 'ready',
                                        child: Text('Ready'),
                                      ),
                                    ],
                                    onChanged: (value) {
                                      if (value == null) return;
                                      _updateItemField(
                                        categoryIndex,
                                        itemIndex,
                                        'status',
                                        value,
                                      );
                                    },
                                    decoration: InputDecoration(
                                      labelText: item['required'] == true
                                          ? 'Required document status'
                                          : 'Optional document status',
                                      border: const OutlineInputBorder(),
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  TextFormField(
                                    initialValue: (item['notes'] ?? '')
                                        .toString(),
                                    minLines: 2,
                                    maxLines: 4,
                                    decoration: const InputDecoration(
                                      labelText: 'Notes',
                                      border: OutlineInputBorder(),
                                    ),
                                    onChanged: (value) => _updateItemField(
                                      categoryIndex,
                                      itemIndex,
                                      'notes',
                                      value,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Wrap(
                                    spacing: 8,
                                    runSpacing: 8,
                                    children: [
                                      OutlinedButton.icon(
                                        onPressed:
                                            _uploadingKey ==
                                                _itemUploadKey(
                                                  categoryIndex,
                                                  itemIndex,
                                                )
                                            ? null
                                            : () => _pickAndUploadFiles(
                                                categoryIndex,
                                                itemIndex,
                                              ),
                                        icon: const Icon(Icons.attach_file),
                                        label: Text(
                                          _uploadingKey ==
                                                  _itemUploadKey(
                                                    categoryIndex,
                                                    itemIndex,
                                                  )
                                              ? 'Upload in progress...'
                                              : 'Upload attachments',
                                        ),
                                      ),
                                      if ((_failedUploadsByKey[_itemUploadKey(
                                                    categoryIndex,
                                                    itemIndex,
                                                  )]
                                                  ?.length ??
                                              0) >
                                          0)
                                        OutlinedButton.icon(
                                          onPressed:
                                              _uploadingKey ==
                                                  _itemUploadKey(
                                                    categoryIndex,
                                                    itemIndex,
                                                  )
                                              ? null
                                              : () => _retryFailedUploads(
                                                  categoryIndex,
                                                  itemIndex,
                                                ),
                                          icon: const Icon(Icons.refresh),
                                          label: Text(
                                            'Retry failed uploads (${_failedUploadsByKey[_itemUploadKey(categoryIndex, itemIndex)]!.length})',
                                          ),
                                        ),
                                    ],
                                  ),
                                  if ((_failedUploadsByKey[_itemUploadKey(
                                                categoryIndex,
                                                itemIndex,
                                              )]
                                              ?.length ??
                                          0) >
                                      0)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 6),
                                      child: Text(
                                        '${_failedUploadsByKey[_itemUploadKey(categoryIndex, itemIndex)]!.length} failed upload${_failedUploadsByKey[_itemUploadKey(categoryIndex, itemIndex)]!.length == 1 ? '' : 's'} pending retry',
                                        style: TextStyle(
                                          color: Colors.orange[700],
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                  if (_uploadingKey ==
                                      _itemUploadKey(categoryIndex, itemIndex))
                                    Padding(
                                      padding: const EdgeInsets.only(top: 6),
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: const [
                                          SizedBox(
                                            width: double.infinity,
                                            child: LinearProgressIndicator(),
                                          ),
                                          SizedBox(height: 4),
                                          Text(
                                            'Updating attachment state...',
                                            style: TextStyle(
                                              color: Colors.blue,
                                              fontSize: 12,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ..._itemFiles(
                                    categoryIndex,
                                    itemIndex,
                                  ).asMap().entries.map(
                                    (entry) => ListTile(
                                      contentPadding: EdgeInsets.zero,
                                      title: Text(
                                        (entry.value['name'] ?? 'Attachment')
                                            .toString(),
                                      ),
                                      subtitle: Text(
                                        (entry.value['type'] ?? '').toString(),
                                      ),
                                      onTap: () => _openItemFile(
                                        categoryIndex,
                                        itemIndex,
                                        entry.key,
                                      ),
                                      trailing: Wrap(
                                        spacing: 4,
                                        children: [
                                          IconButton(
                                            onPressed: () => _openItemFile(
                                              categoryIndex,
                                              itemIndex,
                                              entry.key,
                                            ),
                                            icon: const Icon(Icons.open_in_new),
                                            tooltip: 'Open attachment',
                                          ),
                                          IconButton(
                                            onPressed: () => _removeItemFile(
                                              categoryIndex,
                                              itemIndex,
                                              entry.key,
                                            ),
                                            icon: const Icon(
                                              Icons.delete_outline,
                                              color: Colors.red,
                                            ),
                                            tooltip: 'Remove attachment',
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }),
                        ],
                      ),
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
