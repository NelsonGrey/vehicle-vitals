import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';

import '../theme/design_tokens.dart';
import '../utils/document_analysis_summary.dart';
import '../utils/number_format.dart';

/// Detail view for a single document item (pushed from
/// RecordCategoryScreen). Portfolio state still lives in RecordsScreen's
/// State — this screen reads it through the getters below and writes
/// through the callbacks, then rebuilds itself locally after each async
/// action.
class RecordItemScreen extends StatefulWidget {
  const RecordItemScreen({
    super.key,
    required this.categoryIndex,
    required this.itemIndex,
    required this.getItem,
    required this.getUploadingKey,
    required this.getFailedUploads,
    required this.getAnalysis,
    required this.itemFiles,
    required this.itemUploadKey,
    required this.onUpdateItemField,
    required this.onPickAndUpload,
    required this.onRetryFailedUploads,
    required this.onOpenItemFile,
    required this.onRemoveItemFile,
  });

  final int categoryIndex;
  final int itemIndex;
  final Map<String, dynamic> Function() getItem;
  final String? Function() getUploadingKey;
  final List<PlatformFile>? Function(String key) getFailedUploads;
  final Map<String, dynamic>? Function(String path) getAnalysis;
  final List<Map<String, dynamic>> Function(int categoryIndex, int itemIndex)
  itemFiles;
  final String Function(int categoryIndex, int itemIndex) itemUploadKey;
  final void Function(
    int categoryIndex,
    int itemIndex,
    String field,
    dynamic value,
  )
  onUpdateItemField;
  final Future<void> Function(int categoryIndex, int itemIndex) onPickAndUpload;
  final Future<void> Function(int categoryIndex, int itemIndex)
  onRetryFailedUploads;
  final Future<void> Function(int categoryIndex, int itemIndex, int fileIndex)
  onOpenItemFile;
  final Future<void> Function(int categoryIndex, int itemIndex, int fileIndex)
  onRemoveItemFile;

  @override
  State<RecordItemScreen> createState() => _RecordItemScreenState();
}

List<({String value, String label, Color color, IconData icon})> _statusOptions(
  ColorScheme colorScheme,
) => [
  (
    value: 'missing',
    label: 'Missing',
    color: Colors.grey,
    icon: Icons.radio_button_unchecked,
  ),
  (
    value: 'in-progress',
    label: 'In Progress',
    color: colorScheme.tertiary,
    icon: Icons.hourglass_bottom,
  ),
  (
    value: 'ready',
    label: 'Ready',
    color: AppDesignTokens.success,
    icon: Icons.check_circle,
  ),
];

class _RecordItemScreenState extends State<RecordItemScreen> {
  Future<void> _runAndRefresh(Future<void> Function() action) async {
    await action();
    if (mounted) setState(() {});
  }

  Widget _sectionHeader(BuildContext context, String label) {
    return Text(
      label,
      style: Theme.of(
        context,
      ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final item = widget.getItem();
    final uploadKey = widget.itemUploadKey(
      widget.categoryIndex,
      widget.itemIndex,
    );
    final failedUploads = widget.getFailedUploads(uploadKey);
    final isUploadingThis = widget.getUploadingKey() == uploadKey;
    final required = item['required'] == true;
    final currentStatus = (item['status'] ?? 'missing').toString();
    final files = widget.itemFiles(widget.categoryIndex, widget.itemIndex);

    return Scaffold(
      appBar: AppBar(title: Text((item['title'] ?? '').toString())),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Overview
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  (item['description'] ?? '').toString(),
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: required
                      ? colorScheme.error.withValues(alpha: 0.1)
                      : Colors.grey.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  required ? 'Required' : 'Optional',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: required ? colorScheme.error : Colors.grey[700],
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 24),
          _sectionHeader(context, 'Status'),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _statusOptions(colorScheme).map((option) {
              final selected = currentStatus == option.value;
              return ChoiceChip(
                avatar: Icon(
                  option.icon,
                  size: 18,
                  color: selected ? Colors.white : option.color,
                ),
                label: Text(option.label),
                selected: selected,
                selectedColor: option.color,
                labelStyle: TextStyle(
                  color: selected ? Colors.white : null,
                  fontWeight: selected ? FontWeight.w600 : null,
                ),
                onSelected: (_) {
                  setState(() {
                    widget.onUpdateItemField(
                      widget.categoryIndex,
                      widget.itemIndex,
                      'status',
                      option.value,
                    );
                  });
                },
              );
            }).toList(),
          ),

          const SizedBox(height: 24),
          _sectionHeader(context, 'Notes'),
          const SizedBox(height: 8),
          TextFormField(
            initialValue: (item['notes'] ?? '').toString(),
            minLines: 2,
            maxLines: 4,
            decoration: const InputDecoration(
              hintText: 'Add any details worth remembering about this item',
              border: OutlineInputBorder(),
            ),
            onChanged: (value) => widget.onUpdateItemField(
              widget.categoryIndex,
              widget.itemIndex,
              'notes',
              value,
            ),
          ),

          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _sectionHeader(
                context,
                'Attachments${files.isNotEmpty ? ' (${files.length})' : ''}',
              ),
              TextButton.icon(
                onPressed: isUploadingThis
                    ? null
                    : () => _runAndRefresh(
                        () => widget.onPickAndUpload(
                          widget.categoryIndex,
                          widget.itemIndex,
                        ),
                      ),
                icon: const Icon(Icons.add),
                label: Text(isUploadingThis ? 'Uploading...' : 'Add'),
              ),
            ],
          ),
          if ((failedUploads?.length ?? 0) > 0)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      '${failedUploads!.length} failed upload${failedUploads.length == 1 ? '' : 's'} pending retry',
                      style: TextStyle(
                        color: colorScheme.tertiary,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  TextButton(
                    onPressed: isUploadingThis
                        ? null
                        : () => _runAndRefresh(
                            () => widget.onRetryFailedUploads(
                              widget.categoryIndex,
                              widget.itemIndex,
                            ),
                          ),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            ),
          if (isUploadingThis)
            const Padding(
              padding: EdgeInsets.only(bottom: 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
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
          if (files.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border.all(color: Theme.of(context).dividerColor),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                'No attachments yet. Tap Add to upload one.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            )
          else
            ...files.asMap().entries.map(
              (entry) => _FileAttachmentTile(
                file: entry.value,
                analysis: widget.getAnalysis(
                  (entry.value['path'] ?? '').toString(),
                ),
                onOpen: () => _runAndRefresh(
                  () => widget.onOpenItemFile(
                    widget.categoryIndex,
                    widget.itemIndex,
                    entry.key,
                  ),
                ),
                onRemove: () => _runAndRefresh(
                  () => widget.onRemoveItemFile(
                    widget.categoryIndex,
                    widget.itemIndex,
                    entry.key,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

({String label, Color color}) _analysisBadge(
  double? confidence,
  ColorScheme colorScheme,
) {
  if (confidence == null) {
    return (label: 'Unscored', color: Colors.blueGrey);
  }
  if (confidence >= 0.7) {
    return (label: 'Auto-Verified', color: AppDesignTokens.success);
  }
  if (confidence >= 0.4) {
    return (label: 'Review Suggested', color: colorScheme.tertiary);
  }
  return (label: 'Needs Review', color: colorScheme.error);
}

class _FileAttachmentTile extends StatelessWidget {
  const _FileAttachmentTile({
    required this.file,
    required this.analysis,
    required this.onOpen,
    required this.onRemove,
  });

  final Map<String, dynamic> file;
  final Map<String, dynamic>? analysis;
  final VoidCallback onOpen;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final extracted = Map<String, dynamic>.from(
      analysis?['extracted'] as Map? ?? {},
    );
    final confidence = analysis?['confidence'];
    final sourceText = analysis?['sourceText']?.toString();
    final badge = _analysisBadge(
      confidence is num ? confidence.toDouble() : null,
      Theme.of(context).colorScheme,
    );
    final summary = buildDocumentSummary(
      analysis != null ? extracted : null,
      sourceText,
    );
    final hasExtractedFields =
        extracted['serviceType'] != null ||
        extracted['totalCost'] != null ||
        extracted['serviceDate'] != null ||
        extracted['mileage'] != null;

    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text((file['name'] ?? 'Attachment').toString()),
            subtitle: Text((file['type'] ?? '').toString()),
            onTap: onOpen,
            trailing: Wrap(
              spacing: 4,
              children: [
                IconButton(
                  onPressed: onOpen,
                  icon: const Icon(Icons.open_in_new),
                  tooltip: 'Open attachment',
                ),
                IconButton(
                  onPressed: onRemove,
                  icon: Icon(
                    Icons.delete_outline,
                    color: Theme.of(context).colorScheme.error,
                  ),
                  tooltip: 'Remove attachment',
                ),
              ],
            ),
          ),
          if (analysis != null) ...[
            Padding(
              padding: const EdgeInsets.only(left: 4),
              child: Wrap(
                crossAxisAlignment: WrapCrossAlignment.center,
                spacing: 6,
                runSpacing: 4,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: badge.color.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      badge.label,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: badge.color,
                      ),
                    ),
                  ),
                  Text(summary, style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            ),
            if (hasExtractedFields)
              Padding(
                padding: const EdgeInsets.only(left: 4, top: 4),
                child: ExpansionTile(
                  tilePadding: EdgeInsets.zero,
                  title: const Text(
                    'Analysis details',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                  childrenPadding: const EdgeInsets.only(bottom: 8),
                  children: [
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _AnalysisDetailRow(
                            'Category',
                            (extracted['documentCategory'] ?? 'n/a').toString(),
                          ),
                          _AnalysisDetailRow(
                            'Service type',
                            (extracted['serviceType'] ?? 'n/a').toString(),
                          ),
                          _AnalysisDetailRow(
                            'Total cost',
                            extracted['totalCost'] is num
                                ? formatCurrencyAmount(
                                    extracted['totalCost'] as num,
                                  )
                                : 'n/a',
                          ),
                          _AnalysisDetailRow(
                            'Service date',
                            (extracted['serviceDate'] ?? 'n/a').toString(),
                          ),
                          _AnalysisDetailRow(
                            'Mileage',
                            extracted['mileage'] is num
                                ? '${formatWithCommas(extracted['mileage'] as num)} mi'
                                : 'n/a',
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ],
      ),
    );
  }
}

class _AnalysisDetailRow extends StatelessWidget {
  const _AnalysisDetailRow(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Text(
        '$label: $value',
        style: Theme.of(context).textTheme.bodySmall,
      ),
    );
  }
}
