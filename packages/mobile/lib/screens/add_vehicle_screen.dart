import 'dart:convert';
import 'dart:io';

import 'package:cloud_functions/cloud_functions.dart';
import 'package:file_picker/file_picker.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../models/vehicle.dart';
import '../services/firestore_service.dart';
import '../services/premium_service.dart';
import '../services/record_storage_service.dart';
import '../services/vehicle_photo_service.dart';

const List<String> _vehicleTypeOptions = [
  'Car',
  'Truck',
  'Motorcycle',
  'Recreational Vehicle (RV)',
  'Boat',
  'Van',
  'SUV',
  'Trailer',
  'ATV/UTV',
  'Other',
];

const List<DropdownMenuItem<String>> _vehicleStatusOptions = [
  DropdownMenuItem(value: 'active', child: Text('In Garage')),
  DropdownMenuItem(value: 'stored', child: Text('In Storage')),
];

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
  bool _isPhotoBusy = false;
  int? _recallsCount;
  String? _recallsSource;
  String? _engineType;
  String? _bodyClass;
  String? _fuelType;
  String? _driveType;
  String? _transmissionStyle;
  String? _trim;
  String? _vehicleType;
  String _vehicleStatus = 'active';
  List<Map<String, dynamic>> _recallsItems = const [];
  Map<String, dynamic> _vinProfile = const {};
  Map<String, dynamic> _vinInsights = const {};
  String? _photoUrl;
  String? _photoPath;
  String? _photoSource;
  String? _photoAttributionUrl;
  String? _photoAttributionText;

  final _recordStorageService = RecordStorageService();
  final _vehiclePhotoService = VehiclePhotoService();

  bool _looksLikeVin(String value) => value.trim().length == 17;

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
    if (!_looksLikeVin(vin)) {
      final colorScheme = Theme.of(context).colorScheme;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text(
            'VIN decode requires a 17-character VIN. You can still save using a vehicle ID.',
          ),
          backgroundColor: colorScheme.error,
        ),
      );
      return;
    }

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
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _saveVehicle() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    final premiumService = context.read<PremiumService>();

    try {
      final normalizedVin = _vinController.text.trim().toUpperCase();
      final existingVehicle = await _firestoreService.getVehicle(normalizedVin);
      if (existingVehicle == null) {
        final allVehicles = await _firestoreService.getVehicles();
        final vehicleLimit = premiumService.vehicleLimit;

        if (allVehicles.length >= vehicleLimit) {
          if (!mounted) return;

          final currentTier = premiumService.subscriptionTier;
          final isPremiumLike =
              currentTier == 'premium' || currentTier == 'enterprise';
          final colorScheme = Theme.of(context).colorScheme;

          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                isPremiumLike
                    ? 'Your vehicle limit is reached. Contact support for Enterprise expansion.'
                    : 'Vehicle limit reached. Upgrade to add more vehicles.',
              ),
              backgroundColor: colorScheme.secondary,
            ),
          );

          context.push(isPremiumLike ? '/app/contact' : '/app/premium');
          return;
        }
      }

      var photoUrl = _photoUrl;
      var photoPath = _photoPath;
      var photoSource = _photoSource;
      var photoAttributionUrl = _photoAttributionUrl;
      var photoAttributionText = _photoAttributionText;

      if ((photoUrl == null || photoUrl.isEmpty) &&
          _makeController.text.trim().isNotEmpty &&
          _modelController.text.trim().isNotEmpty) {
        final candidate = await _vehiclePhotoService.findVehiclePhotoFromWeb(
          year: _yearController.text.trim(),
          make: _makeController.text.trim(),
          model: _modelController.text.trim(),
          vehicleType: _vehicleType,
        );
        if (candidate != null && (candidate['url'] ?? '').isNotEmpty) {
          photoUrl = candidate['url'];
          photoPath = '';
          photoSource = candidate['source'];
          photoAttributionUrl = candidate['attributionUrl'];
          photoAttributionText = candidate['attributionText'];
        }
      }

      final vehicle = Vehicle(
        vin: normalizedVin,
        make: _makeController.text.trim(),
        model: _modelController.text.trim(),
        year: int.parse(_yearController.text),
        mileage: int.parse(_mileageController.text),
        photoUrl: photoUrl,
        photoPath: photoPath,
        photoSource: photoSource,
        photoAttributionUrl: photoAttributionUrl,
        photoAttributionText: photoAttributionText,
        recallsCount: _recallsCount ?? 0,
        recallsSource: _recallsSource,
        engineType: _engineType,
        bodyClass: _bodyClass,
        fuelType: _fuelType,
        driveType: _driveType,
        transmissionStyle: _transmissionStyle,
        trim: _trim,
        vehicleType: _vehicleType,
        vehicleStatus: _vehicleStatus,
        recallsItems: _recallsItems,
        vinProfile: _vinProfile,
        vinInsights: _vinInsights,
      );

      await _firestoreService.addOrUpdateVehicle(vehicle);

      if (mounted) {
        final colorScheme = Theme.of(context).colorScheme;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Vehicle added successfully!'),
            backgroundColor: colorScheme.primary,
          ),
        );
        context.go('/app');
      }
    } catch (e) {
      if (mounted) {
        final message = e.toString();
        if (message.contains('Not authenticated')) {
          final colorScheme = Theme.of(context).colorScheme;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('Session expired. Please sign in again.'),
              backgroundColor: colorScheme.error,
            ),
          );
          context.go('/auth/login');
          return;
        }

        final colorScheme = Theme.of(context).colorScheme;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error adding vehicle: $message'),
            backgroundColor: colorScheme.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _pickAndUploadPhoto() async {
    final vin = _vinController.text.trim().toUpperCase();
    if (vin.isEmpty) {
      final colorScheme = Theme.of(context).colorScheme;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Enter a vehicle ID before uploading a photo.'),
          backgroundColor: colorScheme.error,
        ),
      );
      return;
    }

    setState(() => _isPhotoBusy = true);
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.image,
        withData: true,
      );
      if (result == null || result.files.isEmpty) {
        return;
      }

      final uploaded = await _recordStorageService.uploadVehiclePhoto(
        vin,
        result.files.first,
      );

      setState(() {
        _photoUrl = uploaded['url']?.toString();
        _photoPath = uploaded['path']?.toString();
        _photoSource = 'user_upload';
        _photoAttributionUrl = null;
        _photoAttributionText = null;
      });
    } catch (e) {
      if (!mounted) return;
      final colorScheme = Theme.of(context).colorScheme;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Photo upload failed: ${e.toString()}'),
          backgroundColor: colorScheme.error,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isPhotoBusy = false);
      }
    }
  }

  Future<void> _findPhotoFromWeb() async {
    if (_makeController.text.trim().isEmpty ||
        _modelController.text.trim().isEmpty) {
      final colorScheme = Theme.of(context).colorScheme;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text(
            'Add make and model before searching for a web photo.',
          ),
          backgroundColor: colorScheme.error,
        ),
      );
      return;
    }

    setState(() => _isPhotoBusy = true);
    try {
      final candidate = await _vehiclePhotoService.findVehiclePhotoFromWeb(
        year: _yearController.text.trim(),
        make: _makeController.text.trim(),
        model: _modelController.text.trim(),
        vehicleType: _vehicleType,
      );

      if (candidate == null || (candidate['url'] ?? '').isEmpty) {
        if (!mounted) return;
        final colorScheme = Theme.of(context).colorScheme;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text(
              'No web photo match found. Try uploading your own image.',
            ),
            backgroundColor: colorScheme.secondary,
          ),
        );
        return;
      }

      setState(() {
        _photoUrl = candidate['url'];
        _photoPath = '';
        _photoSource = candidate['source'];
        _photoAttributionUrl = candidate['attributionUrl'];
        _photoAttributionText = candidate['attributionText'];
      });
    } catch (e) {
      if (!mounted) return;
      final colorScheme = Theme.of(context).colorScheme;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Web photo lookup failed: ${e.toString()}'),
          backgroundColor: colorScheme.error,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isPhotoBusy = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

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
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: colorScheme.surface,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: colorScheme.outline),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Vehicle Form',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Enter a vehicle ID (VIN/HIN/Serial). VIN decode can auto-fill details for compatible VINs.',
                              style: TextStyle(
                                color: colorScheme.onSurfaceVariant,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),

                      // VIN field
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: _vinController,
                              decoration: const InputDecoration(
                                labelText: 'Vehicle ID (VIN/HIN/Serial)*',
                                border: OutlineInputBorder(),
                                hintText: 'VIN, HIN, or serial number',
                              ),
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'Please enter a vehicle ID';
                                }
                                return null;
                              },
                              textCapitalization: TextCapitalization.characters,
                              onChanged: (value) {
                                // Auto-decode only when ID appears to be a VIN.
                                if (_looksLikeVin(value) && !_isLoading) {
                                  _decodeVIN();
                                }
                              },
                            ),
                          ),
                          const SizedBox(width: 8),
                          IconButton(
                            onPressed: _isLoading ? null : _decodeVIN,
                            icon: const Icon(Icons.search),
                            tooltip: 'Decode VIN (17-character VIN only)',
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      DropdownButtonFormField<String>(
                        initialValue: _vehicleStatus,
                        decoration: const InputDecoration(
                          labelText: 'Location Status',
                          border: OutlineInputBorder(),
                        ),
                        items: _vehicleStatusOptions,
                        onChanged: (value) {
                          setState(() => _vehicleStatus = value ?? 'active');
                        },
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<String>(
                        initialValue: _vehicleType,
                        decoration: const InputDecoration(
                          labelText: 'Vehicle Type',
                          border: OutlineInputBorder(),
                        ),
                        items: _vehicleTypeOptions
                            .map(
                              (type) => DropdownMenuItem<String>(
                                value: type,
                                child: Text(type),
                              ),
                            )
                            .toList(),
                        onChanged: (value) {
                          setState(() => _vehicleType = value);
                        },
                      ),
                      const SizedBox(height: 16),

                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 16),
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
                              _recallsCount == null
                                  ? 'VIN Insight Preview'
                                  : 'Free insights (${_recallsSource ?? 'NHTSA'}): Open recalls: $_recallsCount',
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              _recallsCount == null
                                  ? 'Decode a VIN to preview body class, powertrain details, and recall metadata before saving.'
                                  : [
                                          _engineType,
                                          _transmissionStyle,
                                          _fuelType,
                                          _driveType,
                                          _bodyClass,
                                          _trim,
                                        ]
                                        .where(
                                          (value) =>
                                              value != null &&
                                              value
                                                  .toString()
                                                  .trim()
                                                  .isNotEmpty,
                                        )
                                        .join(' • '),
                              style: TextStyle(
                                fontSize: 12,
                                color: colorScheme.secondary,
                              ),
                            ),
                          ],
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
                      const SizedBox(height: 16),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Vehicle Photo',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Container(
                            height: 140,
                            width: double.infinity,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: colorScheme.outline),
                              color: colorScheme.surface,
                            ),
                            child: _photoUrl != null && _photoUrl!.isNotEmpty
                                ? ClipRRect(
                                    borderRadius: BorderRadius.circular(10),
                                    child: Image.network(
                                      _photoUrl!,
                                      fit: BoxFit.cover,
                                      errorBuilder:
                                          (context, error, stackTrace) =>
                                              const Center(
                                                child: Icon(
                                                  Icons.directions_car,
                                                  size: 42,
                                                ),
                                              ),
                                    ),
                                  )
                                : const Center(
                                    child: Icon(Icons.directions_car, size: 42),
                                  ),
                          ),
                          if (_photoSource == 'wikimedia')
                            Padding(
                              padding: const EdgeInsets.only(top: 6),
                              child: Text(
                                'Source: Wikimedia (free public media)',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: colorScheme.onSurfaceVariant,
                                ),
                              ),
                            ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: _isPhotoBusy
                                      ? null
                                      : _pickAndUploadPhoto,
                                  icon: const Icon(Icons.upload),
                                  label: const Text('Upload Photo'),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: _isPhotoBusy
                                      ? null
                                      : _findPhotoFromWeb,
                                  icon: const Icon(Icons.image_search),
                                  label: const Text('Find Free Web Photo'),
                                ),
                              ),
                            ],
                          ),
                          Text(
                            'Web lookup is best-effort and may not match exact trim or color.',
                            style: TextStyle(
                              fontSize: 11,
                              color: colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
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
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: _isLoading
                      ? CircularProgressIndicator(color: colorScheme.onPrimary)
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
