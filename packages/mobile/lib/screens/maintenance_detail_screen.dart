import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/firestore_service.dart';
import '../models/maintenance.dart';

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
  Maintenance? _entry;
  bool _loading = true;
  DateTime _selectedDate = DateTime.now();

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
          _selectedDate = entry.date;
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
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error loading entry: $e')));
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
        cost: cost,
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
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error updating entry: $e')));
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
            style: TextButton.styleFrom(foregroundColor: Colors.red),
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

        if (mounted) {
          final navigator = Navigator.of(context);
          navigator.pop(); // Go back to maintenance list
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error deleting maintenance entry: $e')),
          );
        }
      }
    }
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
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Maintenance'),
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
