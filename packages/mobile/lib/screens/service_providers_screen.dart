import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/firestore_service.dart';
import '../services/local_providers_service.dart';

class ServiceProvidersScreen extends StatefulWidget {
  const ServiceProvidersScreen({super.key});

  @override
  State<ServiceProvidersScreen> createState() => _ServiceProvidersScreenState();
}

class _ServiceProvidersScreenState extends State<ServiceProvidersScreen> {
  final _street1Controller = TextEditingController();
  final _street2Controller = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _postalCodeController = TextEditingController();
  final _countryController = TextEditingController(text: 'US');

  final LocalProvidersService _providersService = LocalProvidersService();

  int _preferredProviderRadiusMiles = 25;
  String _preferredProviderType = 'all';
  bool _loading = true;
  bool _searching = false;
  String _status = '';
  String _error = '';
  List<Map<String, dynamic>> _providers = const [];

  @override
  void initState() {
    super.initState();
    _loadPreferences();
  }

  @override
  void dispose() {
    _street1Controller.dispose();
    _street2Controller.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _postalCodeController.dispose();
    _countryController.dispose();
    super.dispose();
  }

  Future<void> _loadPreferences() async {
    try {
      final prefs = await context.read<FirestoreService>().getPreferences();
      final homeAddress = Map<String, dynamic>.from(
        prefs['homeAddress'] as Map? ?? const <String, dynamic>{},
      );

      if (!mounted) return;

      setState(() {
        _street1Controller.text = (homeAddress['street1'] ?? '').toString();
        _street2Controller.text = (homeAddress['street2'] ?? '').toString();
        _cityController.text = (homeAddress['city'] ?? '').toString();
        _stateController.text = (homeAddress['stateProvince'] ?? '').toString();
        _postalCodeController.text = (homeAddress['postalCode'] ?? '')
            .toString();
        _countryController.text = (homeAddress['country'] ?? 'US').toString();

        final radius = (prefs['preferredProviderRadiusMiles'] as num?)?.toInt();
        if (radius != null) {
          _preferredProviderRadiusMiles = radius.clamp(5, 100);
        }

        final type = (prefs['preferredProviderType'] ?? 'all').toString();
        if (type == 'all' || type == 'repair_shop' || type == 'dealership') {
          _preferredProviderType = type;
        }

        _loading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Unable to load mechanic preferences: $error';
      });
    }
  }

  String _buildLocationQuery() {
    final parts = [
      _street1Controller.text.trim(),
      _cityController.text.trim(),
      _stateController.text.trim(),
      _postalCodeController.text.trim(),
      _countryController.text.trim(),
    ].where((part) => part.isNotEmpty).toList();

    return parts.join(', ');
  }

  Future<void> _runLookup() async {
    final locationQuery = _buildLocationQuery();
    if (locationQuery.length < 5) {
      setState(() {
        _error = 'Enter a complete address before searching.';
        _status = '';
      });
      return;
    }

    setState(() {
      _searching = true;
      _error = '';
      _status = '';
    });

    try {
      final firestoreService = context.read<FirestoreService>();
      final result = await _providersService.getLocalServiceProviders(
        locationQuery: locationQuery,
        radiusMiles: _preferredProviderRadiusMiles,
        maxResults: 8,
        providerType: _preferredProviderType,
      );

      await firestoreService.updatePreferences({
        'homeAddress': {
          'street1': _street1Controller.text.trim(),
          'street2': _street2Controller.text.trim(),
          'city': _cityController.text.trim(),
          'stateProvince': _stateController.text.trim(),
          'postalCode': _postalCodeController.text.trim(),
          'country': _countryController.text.trim().isEmpty
              ? 'US'
              : _countryController.text.trim(),
        },
        'preferredProviderRadiusMiles': _preferredProviderRadiusMiles,
        'preferredProviderType': _preferredProviderType,
      });

      if (!mounted) return;
      setState(() {
        _providers = List<Map<String, dynamic>>.from(
          result['providers'] as List? ?? const <Map<String, dynamic>>[],
        );
        _status =
            'Found ${_providers.length} mechanic(s) from ${(result['source'] ?? 'unknown').toString()}.';
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _providers = const [];
        _error = 'Mechanic lookup failed: $error';
      });
    } finally {
      if (mounted) {
        setState(() {
          _searching = false;
        });
      }
    }
  }

  String _formatAddress(Map<String, dynamic> provider) {
    final city = (provider['city'] ?? '').toString();
    final state = (provider['state'] ?? '').toString();
    if (city.isEmpty && state.isEmpty) {
      return (provider['address'] ?? '').toString();
    }

    return [city, state].where((part) => part.isNotEmpty).join(', ');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mechanics')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (_status.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Text(
                      _status,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.primary,
                      ),
                    ),
                  ),
                if (_error.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Text(
                      _error,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.error,
                      ),
                    ),
                  ),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Search Preferences',
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _street1Controller,
                          decoration: const InputDecoration(
                            labelText: 'Street',
                          ),
                        ),
                        TextField(
                          controller: _street2Controller,
                          decoration: const InputDecoration(
                            labelText: 'Street 2 (optional)',
                          ),
                        ),
                        TextField(
                          controller: _cityController,
                          decoration: const InputDecoration(labelText: 'City'),
                        ),
                        TextField(
                          controller: _stateController,
                          decoration: const InputDecoration(
                            labelText: 'State/Province',
                          ),
                        ),
                        TextField(
                          controller: _postalCodeController,
                          decoration: const InputDecoration(
                            labelText: 'Postal Code',
                          ),
                        ),
                        TextField(
                          controller: _countryController,
                          decoration: const InputDecoration(
                            labelText: 'Country',
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Search radius: $_preferredProviderRadiusMiles miles',
                        ),
                        Slider(
                          value: _preferredProviderRadiusMiles.toDouble(),
                          min: 5,
                          max: 100,
                          divisions: 95,
                          label: '$_preferredProviderRadiusMiles miles',
                          onChanged: _searching
                              ? null
                              : (value) {
                                  setState(() {
                                    _preferredProviderRadiusMiles = value
                                        .round();
                                  });
                                },
                        ),
                        const SizedBox(height: 8),
                        DropdownButtonFormField<String>(
                          initialValue: _preferredProviderType,
                          decoration: const InputDecoration(
                            labelText: 'Mechanic type',
                          ),
                          items: const [
                            DropdownMenuItem(
                              value: 'all',
                              child: Text('All mechanics'),
                            ),
                            DropdownMenuItem(
                              value: 'repair_shop',
                              child: Text('Repair shops'),
                            ),
                            DropdownMenuItem(
                              value: 'dealership',
                              child: Text('Dealerships'),
                            ),
                          ],
                          onChanged: _searching
                              ? null
                              : (value) {
                                  if (value == null) return;
                                  setState(() {
                                    _preferredProviderType = value;
                                  });
                                },
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: _searching ? null : _runLookup,
                          icon: _searching
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                )
                              : const Icon(Icons.search),
                          label: const Text('Find Nearby Mechanics'),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                ..._providers.map((provider) {
                  final name = (provider['name'] ?? 'Unnamed mechanic')
                      .toString();
                  final providerType = (provider['providerType'] ?? 'mechanic')
                      .toString();
                  final distanceMiles = (provider['distanceMiles'] as num?)
                      ?.toStringAsFixed(1);

                  return Card(
                    child: ListTile(
                      title: Text(name),
                      subtitle: Text(
                        [
                          _formatAddress(provider),
                          providerType.replaceAll('_', ' '),
                          if (distanceMiles != null) '$distanceMiles mi away',
                        ].where((value) => value.isNotEmpty).join(' • '),
                      ),
                      trailing: const Icon(Icons.chevron_right),
                    ),
                  );
                }),
              ],
            ),
    );
  }
}
