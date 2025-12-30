import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/firestore_service.dart';
import '../models/vehicle.dart';

class EditVehicleScreen extends StatefulWidget {
  final String vin;

  const EditVehicleScreen({super.key, required this.vin});

  @override
  State<EditVehicleScreen> createState() => _EditVehicleScreenState();
}

class _EditVehicleScreenState extends State<EditVehicleScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firestoreService = FirestoreService();

  final _vinController = TextEditingController();
  final _makeController = TextEditingController();
  final _modelController = TextEditingController();
  final _yearController = TextEditingController();
  final _mileageController = TextEditingController();

  bool _isLoading = true;
  bool _isSaving = false;
  Vehicle? _vehicle;

  @override
  void initState() {
    super.initState();
    _loadVehicle();
  }

  @override
  void dispose() {
    _vinController.dispose();
    _makeController.dispose();
    _modelController.dispose();
    _yearController.dispose();
    _mileageController.dispose();
    super.dispose();
  }

  Future<void> _loadVehicle() async {
    try {
      final vehicle = await _firestoreService.getVehicle(widget.vin);
      if (vehicle != null && mounted) {
        setState(() {
          _vehicle = vehicle;
          _vinController.text = vehicle.vin;
          _makeController.text = vehicle.make;
          _modelController.text = vehicle.model;
          _yearController.text = vehicle.year.toString();
          _mileageController.text = vehicle.mileage.toString();
          _isLoading = false;
        });
      } else if (mounted) {
        // Vehicle not found, go back
        context.go('/');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading vehicle: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
        context.go('/');
      }
    }
  }

  Future<void> _saveVehicle() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);

    try {
      final updatedVehicle = _vehicle!.copyWith(
        make: _makeController.text.trim(),
        model: _modelController.text.trim(),
        year: int.parse(_yearController.text),
        mileage: int.parse(_mileageController.text),
      );

      await _firestoreService.addOrUpdateVehicle(updatedVehicle);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Vehicle updated successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        context.go('/');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error updating vehicle: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  Future<void> _deleteVehicle() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Vehicle'),
        content: Text(
          'Are you sure you want to delete this ${_vehicle?.year} ${_vehicle?.make} ${_vehicle?.model}?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await _firestoreService.deleteVehicle(widget.vin);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Vehicle deleted successfully!'),
              backgroundColor: Colors.green,
            ),
          );
          context.go('/');
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Error deleting vehicle: ${e.toString()}'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Vehicle'),
        actions: [
          IconButton(
            onPressed: _deleteVehicle,
            icon: const Icon(Icons.delete),
            color: Colors.red,
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    children: [
                      // VIN field (read-only)
                      TextFormField(
                        controller: _vinController,
                        decoration: const InputDecoration(
                          labelText: 'VIN',
                          border: OutlineInputBorder(),
                        ),
                        readOnly: true,
                        style: TextStyle(color: Colors.grey[600]),
                      ),
                      const SizedBox(height: 16),

                      // Make field
                      TextFormField(
                        controller: _makeController,
                        decoration: const InputDecoration(
                          labelText: 'Make*',
                          border: OutlineInputBorder(),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter the make';
                          }
                          return null;
                        },
                        textCapitalization: TextCapitalization.words,
                      ),
                      const SizedBox(height: 16),

                      // Model field
                      TextFormField(
                        controller: _modelController,
                        decoration: const InputDecoration(
                          labelText: 'Model*',
                          border: OutlineInputBorder(),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter the model';
                          }
                          return null;
                        },
                        textCapitalization: TextCapitalization.words,
                      ),
                      const SizedBox(height: 16),

                      // Year field
                      TextFormField(
                        controller: _yearController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Year*',
                          border: OutlineInputBorder(),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter the year';
                          }
                          final year = int.tryParse(value);
                          if (year == null) {
                            return 'Please enter a valid year';
                          }
                          final currentYear = DateTime.now().year;
                          if (year < 1900 || year > currentYear + 1) {
                            return 'Please enter a valid year (1900-${currentYear + 1})';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),

                      // Mileage field
                      TextFormField(
                        controller: _mileageController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Mileage*',
                          border: OutlineInputBorder(),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter the mileage';
                          }
                          final mileage = int.tryParse(value);
                          if (mileage == null || mileage < 0) {
                            return 'Please enter a valid mileage';
                          }
                          return null;
                        },
                      ),
                    ],
                  ),
                ),
              ),

              // Save button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isSaving ? null : _saveVehicle,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFF59E0B),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: _isSaving
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text('Save Changes'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
