import 'dart:convert';
import 'dart:io';

import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../models/vehicle.dart';
import '../services/firestore_service.dart';

class AddVehicleScreen extends StatefulWidget {
  const AddVehicleScreen({super.key, this.initialVin});

  final String? initialVin;

  @override
  State<AddVehicleScreen> createState() => _AddVehicleScreenState();
}

class _AddVehicleScreenState extends State<AddVehicleScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firestoreService = FirestoreService();

  final _vinController = TextEditingController();
  final _makeController = TextEditingController();
  final _modelController = TextEditingController();
  final _yearController = TextEditingController();
  final _mileageController = TextEditingController();

  bool _isLoading = false;
  int? _recallsCount;
  String? _recallsSource;
  String? _bodyClass;
  String? _fuelType;
  String? _driveType;
  String? _transmissionStyle;
  String? _trim;
  String? _vehicleType;

  @override
  void initState() {
    super.initState();
    _yearController.text = DateTime.now().year.toString();
    if (widget.initialVin != null) {
      _vinController.text = widget.initialVin!;
    }
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

  Future<void> _decodeVIN() async {
    final vin = _vinController.text.trim().toUpperCase();
    if (vin.length != 17) return;

    setState(() => _isLoading = true);

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
        final errorMessage = (data['error'] ?? 'VIN decode failed').toString();
        throw Exception(errorMessage);
      }

      final free = Map<String, dynamic>.from(
        data['free'] as Map? ?? <String, dynamic>{},
      );
      final recalls = Map<String, dynamic>.from(
        free['recalls'] as Map? ?? <String, dynamic>{},
      );

      final vehicleData = Map<String, dynamic>.from(
        (free['vinProfile'] as Map?) ??
            (data['vehicle'] as Map?) ??
            <String, dynamic>{},
      );
      final decodedYear = (vehicleData['year'] ?? '').toString();

      setState(() {
        _makeController.text = (vehicleData['make'] ?? '').toString();
        _modelController.text = (vehicleData['model'] ?? '').toString();
        if (decodedYear.isNotEmpty) {
          _yearController.text = decodedYear;
        }

        final recallsCountValue = int.tryParse(
          (recalls['count'] ?? '0').toString(),
        );
        _recallsCount = recallsCountValue;
        _recallsSource = (recalls['source'] ?? 'NHTSA').toString();
        _bodyClass = (vehicleData['bodyClass'] ?? '').toString();
        _fuelType = (vehicleData['fuelType'] ?? '').toString();
        _driveType = (vehicleData['driveType'] ?? '').toString();
        _transmissionStyle = (vehicleData['transmissionStyle'] ?? '')
            .toString();
        _trim = (vehicleData['trim'] ?? '').toString();
        _vehicleType = (vehicleData['vehicleType'] ?? '').toString();
      });

      if (mounted) {
        final recallsNote = _recallsCount == null
            ? ''
            : ' • Open recalls: ${_recallsCount!}';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('VIN decoded successfully$recallsNote'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error decoding VIN: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _saveVehicle() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final vehicle = Vehicle(
        vin: _vinController.text.trim().toUpperCase(),
        make: _makeController.text.trim(),
        model: _modelController.text.trim(),
        year: int.parse(_yearController.text),
        mileage: int.parse(_mileageController.text),
        recallsCount: _recallsCount ?? 0,
        recallsSource: _recallsSource,
        bodyClass: _bodyClass,
        fuelType: _fuelType,
        driveType: _driveType,
        transmissionStyle: _transmissionStyle,
        trim: _trim,
        vehicleType: _vehicleType,
      );

      await _firestoreService.addOrUpdateVehicle(vehicle);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Vehicle added successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        context.go('/app');
      }
    } catch (e) {
      if (mounted) {
        final message = e.toString();
        if (message.contains('Not authenticated')) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Session expired. Please sign in again.'),
              backgroundColor: Colors.red,
            ),
          );
          context.go('/auth/login');
          return;
        }

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error adding vehicle: $message'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Vehicle'),
        actions: [
          TextButton(
            onPressed: () => context.push('/app/scan-vin'),
            child: const Text('Scan VIN'),
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
                      // VIN field
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: _vinController,
                              decoration: const InputDecoration(
                                labelText: 'VIN*',
                                border: OutlineInputBorder(),
                                hintText: '17-character VIN',
                              ),
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'Please enter the VIN';
                                }
                                if (value.length != 17) {
                                  return 'VIN must be 17 characters';
                                }
                                return null;
                              },
                              textCapitalization: TextCapitalization.characters,
                              onChanged: (value) {
                                // Auto-decode when VIN is complete
                                if (value.length == 17 && !_isLoading) {
                                  _decodeVIN();
                                }
                              },
                            ),
                          ),
                          const SizedBox(width: 8),
                          IconButton(
                            onPressed: _isLoading ? null : _decodeVIN,
                            icon: const Icon(Icons.search),
                            tooltip: 'Decode VIN',
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      if (_recallsCount != null)
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            color: Colors.amber.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: Colors.amber.withValues(alpha: 0.35),
                            ),
                          ),
                          child: Text(
                            'Free insights (${_recallsSource ?? 'NHTSA'}): '
                            'Open recalls: $_recallsCount',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),

                      // Make field
                      TextFormField(
                        controller: _makeController,
                        decoration: const InputDecoration(
                          labelText: 'Make*',
                          border: OutlineInputBorder(),
                          hintText: 'e.g., Toyota, Ford, Honda',
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
                          hintText: 'e.g., Camry, F-150, Civic',
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
                          hintText: 'Current mileage',
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
                  onPressed: _isLoading ? null : _saveVehicle,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFF59E0B),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: _isLoading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text('Save Vehicle'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
