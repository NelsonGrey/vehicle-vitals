import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';

import '../theme/design_tokens.dart';
import 'record_item_screen.dart';

/// Item list for a single document category (pushed from RecordsScreen).
/// All portfolio state lives in RecordsScreen's State — this screen reads
/// it through the getters below and forwards the same callbacks down to
/// RecordItemScreen for the actual per-item editing UI.
class RecordCategoryScreen extends StatefulWidget {
  const RecordCategoryScreen({
    super.key,
    required this.categoryIndex,
    required this.categoryTitle,
    required this.getCategory,
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
  final String categoryTitle;
  final Map<String, dynamic> Function() getCategory;
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
  State<RecordCategoryScreen> createState() => _RecordCategoryScreenState();
}

class _RecordCategoryScreenState extends State<RecordCategoryScreen> {
  void _openItem(int itemIndex) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => RecordItemScreen(
          categoryIndex: widget.categoryIndex,
          itemIndex: itemIndex,
          getItem: () {
            final items = (widget.getCategory()['items'] as List?) ?? [];
            return Map<String, dynamic>.from(items[itemIndex] as Map);
          },
          getUploadingKey: widget.getUploadingKey,
          getFailedUploads: widget.getFailedUploads,
          getAnalysis: widget.getAnalysis,
          itemFiles: widget.itemFiles,
          itemUploadKey: widget.itemUploadKey,
          onUpdateItemField: widget.onUpdateItemField,
          onPickAndUpload: widget.onPickAndUpload,
          onRetryFailedUploads: widget.onRetryFailedUploads,
          onOpenItemFile: widget.onOpenItemFile,
          onRemoveItemFile: widget.onRemoveItemFile,
        ),
      ),
    ).then((_) => setState(() {}));
  }

  @override
  Widget build(BuildContext context) {
    final category = widget.getCategory();
    final items = (category['items'] as List?) ?? [];

    return Scaffold(
      appBar: AppBar(title: Text(widget.categoryTitle)),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: items.length,
        itemBuilder: (context, itemIndex) {
          final item = Map<String, dynamic>.from(items[itemIndex] as Map);
          final status = (item['status'] ?? 'missing').toString();
          final required = item['required'] == true;
          final fileCount = widget
              .itemFiles(widget.categoryIndex, itemIndex)
              .length;

          final colorScheme = Theme.of(context).colorScheme;
          final Color statusColor;
          final IconData statusIcon;
          switch (status) {
            case 'ready':
              statusColor = AppDesignTokens.success;
              statusIcon = Icons.check_circle;
              break;
            case 'in-progress':
              statusColor = colorScheme.tertiary;
              statusIcon = Icons.hourglass_bottom;
              break;
            default:
              statusColor = required ? colorScheme.error : Colors.grey;
              statusIcon = required
                  ? Icons.error_outline
                  : Icons.radio_button_unchecked;
          }

          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              onTap: () => _openItem(itemIndex),
              leading: Icon(statusIcon, color: statusColor),
              title: Text((item['title'] ?? '').toString()),
              subtitle: Text(
                '${required ? 'Required' : 'Optional'} • '
                '${_statusLabel(status)}'
                '${fileCount > 0 ? ' • $fileCount file${fileCount == 1 ? '' : 's'}' : ''}',
              ),
              trailing: const Icon(Icons.chevron_right),
            ),
          );
        },
      ),
    );
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'ready':
        return 'Ready';
      case 'in-progress':
        return 'In Progress';
      default:
        return 'Missing';
    }
  }
}
