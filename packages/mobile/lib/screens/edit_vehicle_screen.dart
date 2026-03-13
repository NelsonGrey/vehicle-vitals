import 'dart:convert';
import 'dart:io';

import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../models/vehicle.dart';
import '../services/firestore_service.dart';

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
  bool _isDecoding = false;
  Vehicle? _vehicle;

  int? _recallsCount;
  String? _recallsSource;
  String? _engineType;
  String? _bodyClass;
  String? _fuelType;
  String? _driveType;
  String? _transmissionStyle;
  String? _trim;
  String? _vehicleType;
  List<Map<String, dynamic>> _recallsItems = const [];
  Map<String, dynamic> _vinProfile = const {};
  Map<String, dynamic> _vinInsights = const {};

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

          _recallsCount = vehicle.recallsCount;
          _recallsSource = vehicle.recallsSource;
          _engineType = vehicle.engineType;
          _bodyClass = vehicle.bodyClass;
          _fuelType = vehicle.fuelType;
          _driveType = vehicle.driveType;
          _transmissionStyle = vehicle.transmissionStyle;
          _trim = vehicle.trim;
          _vehicleType = vehicle.vehicleType;
          _recallsItems = vehicle.recallsItems ?? const [];
          _vinProfile = vehicle.vinProfile ?? const {};
          _vinInsights = vehicle.vinInsights ?? const {};
          _isLoading = false;
        });
      } else if (mounted) {
        context.go('/app');
      }
    } catch (e) {
      if (mounted) {
        final colorScheme = Theme.of(context).colorScheme;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading vehicle: ${e.toString()}'),
            backgroundColor: colorScheme.error,
          ),
        );
        context.go('/app');
      }
    }
  }

  Future<void> _decodeVinInsights() async {
    final vin = _vinController.text.trim().toUpperCase();
    if (vin.length != 17) {
      final colorScheme = Theme.of(context).colorScheme;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('VIN must be 17 characters to decode.'),
          backgroundColor: colorScheme.error,
        ),
      );
      return;
    }

    setState(() => _isDecoding = true);

    try {
      Map<String, dynamic> data;
      final functions = FirebaseFunctions.instanceFor(region: 'us-central1');

      try {
        final result = await functions
            .httpsCallable('getVehicleInsightsCallable')
            .call({'vin': vin});
        data = Map<String, dynamic>.from(result.data as Map);
      } on FirebaseFunctionsException catch (e) {
        final shouldFallback =
            e.code == 'not-found' ||
            e.code == 'unimplemented' ||
            e.code == 'internal';

        if (!shouldFallback) {
          if (e.code == 'unauthenticated') {
            throw Exception('Please sign in to decode VIN.');
          }
          throw Exception(e.message ?? 'VIN decode service unavailable');
        }

        try {
          final decodeResult = await functions
              .httpsCallable('decodeVINCallable')
              .call({'vin': vin});
          data = Map<String, dynamic>.from(decodeResult.data as Map);
        } on FirebaseFunctionsException catch (decodeError) {
          final decodeFallbackAllowed =
              decodeError.code == 'not-found' ||
              decodeError.code == 'unimplemented' ||
              decodeError.code == 'internal';

          if (!decodeFallbackAllowed) {
            if (decodeError.code == 'unauthenticated') {
              throw Exception('Please sign in to decode VIN.');
            }
            throw Exception(
              decodeError.message ?? 'VIN decode service unavailable',
            );
          }

          final projectId = Firebase.app().options.projectId;
          final uri = Uri.parse(
            'https://us-central1-$projectId.cloudfunctions.net/decodeVIN',
          );

          final client = HttpClient();
          final request = await client.postUrl(uri);
          request.headers.contentType = ContentType.json;
          request.write(jsonEncode({'vin': vin}));

          final response = await request.close();
          final responseBody = await response.transform(utf8.decoder).join();
          final decoded = jsonDecode(responseBody);
          data = Map<String, dynamic>.from(
            decoded is Map ? decoded : <String, dynamic>{},
          );

          if (response.statusCode < 200 || response.statusCode >= 300) {
            final errorMessage = (data['error'] ?? 'VIN decode failed')
                .toString();
            throw Exception(errorMessage);
          }
        }
      }

      if (data['success'] != true) {
        throw Exception((data['error'] ?? 'VIN decode failed').toString());
      }

      final free = Map<String, dynamic>.from(
        data['free'] as Map? ?? <String, dynamic>{},
      );
      final recalls = Map<String, dynamic>.from(
        free['recalls'] as Map? ?? <String, dynamic>{},
      );
      final recallsItems = ((recalls['items'] as List?) ?? const [])
          .map((item) => Map<String, dynamic>.from(item as Map))
          .toList();

      final vehicleData = Map<String, dynamic>.from(
        (free['vinProfile'] as Map?) ??
            (data['vehicle'] as Map?) ??
            <String, dynamic>{},
      );

      final decodedYear = (vehicleData['year'] ?? '').toString();

      setState(() {
        _makeController.text = (vehicleData['make'] ?? _makeController.text)
            .toString();
        _modelController.text = (vehicleData['model'] ?? _modelController.text)
            .toString();
        if (decodedYear.isNotEmpty) {
          _yearController.text = decodedYear;
        }

        _recallsCount = int.tryParse((recalls['count'] ?? '0').toString());
        _recallsSource = (recalls['source'] ?? 'NHTSA').toString();
        _engineType = (vehicleData['engineType'] ?? '').toString();
        _bodyClass = (vehicleData['bodyClass'] ?? '').toString();
        _fuelType = (vehicleData['fuelType'] ?? '').toString();
        _driveType = (vehicleData['driveType'] ?? '').toString();
        _transmissionStyle = (vehicleData['transmissionStyle'] ?? '')
            .toString();
        _trim = (vehicleData['trim'] ?? '').toString();
        _vehicleType = (vehicleData['vehicleType'] ?? '').toString();
        _recallsItems = recallsItems;
        _vinProfile = Map<String, dynamic>.from(vehicleData);
        _vinInsights = {
          ...Map<String, dynamic>.from(data),
          'fetchedAt': DateTime.now().toUtc().toIso8601String(),
        };
      });

      if (mounted) {
        final recallsNote = _recallsCount == null
            ? ''
            : ' • Open recalls: ${_recallsCount!}';
        final colorScheme = Theme.of(context).colorScheme;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('VIN decoded successfully$recallsNote'),
            backgroundColor: colorScheme.primary,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        final colorScheme = Theme.of(context).colorScheme;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error decoding VIN: ${e.toString()}'),
            backgroundColor: colorScheme.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isDecoding = false);
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
        recallsCount: _recallsCount ?? 0,
        recallsSource: _recallsSource,
        engineType: _engineType,
        bodyClass: _bodyClass,
        fuelType: _fuelType,
        driveType: _driveType,
        transmissionStyle: _transmissionStyle,
        trim: _trim,
        vehicleType: _vehicleType,
        recallsItems: _recallsItems,
        vinProfile: _vinProfile,
        vinInsights: _vinInsights,
      );

      await _firestoreService.addOrUpdateVehicle(updatedVehicle);

      if (mounted) {
        final colorScheme = Theme.of(context).colorScheme;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Vehicle updated successfully!'),
            backgroundColor: colorScheme.primary,
          ),
        );
        context.go('/app');
      }
    } catch (e) {
      if (mounted) {
        final colorScheme = Theme.of(context).colorScheme;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error updating vehicle: ${e.toString()}'),
            backgroundColor: colorScheme.error,
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
        await _firestoreService.deleteVehicle(widget.vin);
        if (mounted) {
          final colorScheme = Theme.of(context).colorScheme;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('Vehicle deleted successfully!'),
              backgroundColor: colorScheme.primary,
            ),
          );
          context.go('/app');
        }
      } catch (e) {
        if (mounted) {
          final colorScheme = Theme.of(context).colorScheme;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Error deleting vehicle: ${e.toString()}'),
              backgroundColor: colorScheme.error,
            ),
          );
        }
      }
    }
  }

  Widget _buildInsightLine(String label, String? value) {
    if (value == null || value.trim().isEmpty) {
      return const SizedBox.shrink();
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Text(
        '$label: $value',
        style: TextStyle(
          fontSize: 12,
          color: Theme.of(context).colorScheme.secondary,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

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
            color: colorScheme.error,
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
                      TextFormField(
                        controller: _vinController,
                        decoration: const InputDecoration(
                          labelText: 'VIN',
                          border: OutlineInputBorder(),
                        ),
                        readOnly: true,
                        style: TextStyle(color: colorScheme.onSurfaceVariant),
                      ),
                      const SizedBox(height: 10),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          onPressed: _isDecoding ? null : _decodeVinInsights,
                          icon: _isDecoding
                              ? const SizedBox(
                                  height: 16,
                                  width: 16,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                )
                              : const Icon(Icons.search),
                          label: Text(
                            _isDecoding
                                ? 'Decoding VIN...'
                                : 'Refresh VIN Insights',
                          ),
                        ),
                      ),
                      if (_recallsCount != null) ...[
                        const SizedBox(height: 12),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: colorScheme.secondary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: colorScheme.secondary.withValues(
                                alpha: 0.35,
                              ),
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Insights (${_recallsSource ?? 'NHTSA'}) • Open recalls: $_recallsCount',
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 6),
                              _buildInsightLine('Engine', _engineType),
                              _buildInsightLine(
                                'Transmission',
                                _transmissionStyle,
                              ),
                              _buildInsightLine('Fuel', _fuelType),
                              _buildInsightLine('Drive', _driveType),
                              _buildInsightLine('Body', _bodyClass),
                              _buildInsightLine('Trim', _trim),
                              _buildInsightLine('Vehicle Type', _vehicleType),
                            ],
                          ),
                        ),
                      ],
                      const SizedBox(height: 16),
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
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isSaving ? null : _saveVehicle,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: _isSaving
                      ? CircularProgressIndicator(color: colorScheme.onPrimary)
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
