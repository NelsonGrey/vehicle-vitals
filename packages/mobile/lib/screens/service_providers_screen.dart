import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/firestore_service.dart';
import '../services/local_providers_service.dart';

class ServiceProvidersScreen extends StatefulWidget {
  const ServiceProvidersScreen({super.key});

  @override
  State<ServiceProvidersScreen> createState() => _ServiceProvidersScreenState();
}

class _ServiceProvidersScreenState extends State<ServiceProvidersScreen>
    with SingleTickerProviderStateMixin {
  final _street1Controller = TextEditingController();
  final _street2Controller = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _postalCodeController = TextEditingController();
  final _countryController = TextEditingController(text: 'US');

  final LocalProvidersService _providersService = LocalProvidersService();
  late final TabController _tabController;

  int _preferredProviderRadiusMiles = 25;
  String _preferredProviderType = 'all';
  bool _loading = true;
  bool _searching = false;
  String _status = '';
  String _error = '';
  List<Map<String, dynamic>> _providers = const [];

  // Providers pinned via preferences.preferredProviders — mirrors
  // packages/web's Mechanics "Preferred" tab so pinning is a shared concept
  // across platforms, not a web-only feature.
  List<Map<String, dynamic>> _preferredProviders = [];
  String? _savingPreferredId;

  // Distinct provider names pulled from maintenance entries' providerName
  // field across every vehicle in the garage — mirrors web's "Providers
  // You've Used" list.
  List<Map<String, dynamic>> _pastProviders = [];
  bool _loadingPastProviders = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadPreferences();
    _loadPastProviders();
  }

  @override
  void dispose() {
    _street1Controller.dispose();
    _street2Controller.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _postalCodeController.dispose();
    _countryController.dispose();
    _tabController.dispose();
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
        if (type == 'all' ||
            type == 'repair_shop' ||
            type == 'dealership' ||
            type == 'body_shop' ||
            type == 'car_wash' ||
            type == 'detailer') {
          _preferredProviderType = type;
        }

        _preferredProviders = List<Map<String, dynamic>>.from(
          (prefs['preferredProviders'] as List? ?? const <dynamic>[]).map(
            (item) => Map<String, dynamic>.from(item as Map),
          ),
        );

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

  Future<void> _loadPastProviders() async {
    try {
      final firestoreService = context.read<FirestoreService>();
      final vehicles = await firestoreService.getVehicles();
      final byName = <String, Map<String, dynamic>>{};

      for (final vehicle in vehicles) {
        final entries = await firestoreService.getMaintenanceEntries(
          vehicle.vin,
        );
        for (final entry in entries) {
          final name = entry.providerName.trim();
          if (name.isEmpty) continue;

          final existing = byName[name];
          if (existing != null) {
            existing['serviceCount'] = (existing['serviceCount'] as int) + 1;
            final lastDate = existing['lastServiceDate'] as DateTime?;
            if (lastDate == null || entry.date.isAfter(lastDate)) {
              existing['lastServiceDate'] = entry.date;
            }
          } else {
            byName[name] = {
              'name': name,
              'serviceCount': 1,
              'lastServiceDate': entry.date,
            };
          }
        }
      }

      final sorted = byName.values.toList()
        ..sort(
          (a, b) =>
              (b['serviceCount'] as int).compareTo(a['serviceCount'] as int),
        );

      if (!mounted) return;
      setState(() {
        _pastProviders = sorted;
        _loadingPastProviders = false;
      });
    } catch (_) {
      // Non-critical — past providers is a nice-to-have summary.
      if (!mounted) return;
      setState(() => _loadingPastProviders = false);
    }
  }

  Future<void> _savePreferredProviders(
    List<Map<String, dynamic>> next,
  ) async {
    setState(() => _preferredProviders = next);
    try {
      await context.read<FirestoreService>().updatePreferences({
        'preferredProviders': next,
      });
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = 'Failed to save preferred mechanics: $error');
    }
  }

  Future<void> _addPreferredProvider(Map<String, dynamic> candidate) async {
    if (_preferredProviders.any((p) => p['id'] == candidate['id'])) return;
    setState(() => _savingPreferredId = candidate['id']?.toString());
    await _savePreferredProviders([..._preferredProviders, candidate]);
    if (mounted) setState(() => _savingPreferredId = null);
  }

  Future<void> _removePreferredProvider(String id) async {
    setState(() => _savingPreferredId = id);
    await _savePreferredProviders(
      _preferredProviders.where((p) => p['id'] != id).toList(),
    );
    if (mounted) setState(() => _savingPreferredId = null);
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
      appBar: AppBar(
        title: const Text('Mechanics'),
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            const Tab(text: 'Search'),
            Tab(
              text: _preferredProviders.isEmpty
                  ? 'Preferred'
                  : 'Preferred (${_preferredProviders.length})',
            ),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [_buildSearchTab(context), _buildPreferredTab(context)],
            ),
    );
  }

  Widget _buildSearchTab(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (_status.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(
              _status,
              style: TextStyle(color: Theme.of(context).colorScheme.primary),
            ),
          ),
        if (_error.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(
              _error,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
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
                              child: Text('All providers'),
                            ),
                            DropdownMenuItem(
                              value: 'repair_shop',
                              child: Text('Repair shops'),
                            ),
                            DropdownMenuItem(
                              value: 'dealership',
                              child: Text('Dealerships'),
                            ),
                            DropdownMenuItem(
                              value: 'body_shop',
                              child: Text('Body shops'),
                            ),
                            DropdownMenuItem(
                              value: 'car_wash',
                              child: Text('Vehicle washes'),
                            ),
                            DropdownMenuItem(
                              value: 'detailer',
                              child: Text('Detailers'),
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
                  final providerType =
                      (provider['type'] ??
                              provider['providerType'] ??
                              'provider')
                          .toString();
                  final distanceMiles = (provider['distanceMiles'] as num?)
                      ?.toStringAsFixed(1);
                  final id = (provider['id'] ?? name).toString();
                  final isPreferred = _preferredProviders.any(
                    (p) => p['id'] == id,
                  );

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
                      trailing: IconButton(
                        icon: Icon(
                          isPreferred ? Icons.star : Icons.star_border,
                          color: isPreferred
                              ? Theme.of(context).colorScheme.primary
                              : null,
                        ),
                        tooltip: isPreferred
                            ? 'Preferred mechanic'
                            : 'Save as preferred',
                        onPressed: _savingPreferredId == id || isPreferred
                            ? null
                            : () => _addPreferredProvider({
                                'id': id,
                                'name': name,
                                'type': providerType,
                                'address': _formatAddress(provider),
                                'phone': (provider['phone'] ?? '').toString(),
                                'website': (provider['website'] ?? '')
                                    .toString(),
                              }),
                      ),
                    ),
                  );
                }),
              ],
            );
  }

  Widget _buildPreferredTab(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'Preferred Mechanics',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 4),
        Text(
          "Pin mechanics you trust from search results or your service "
          'history so they\'re easy to find next time.',
          style: TextStyle(color: Colors.grey[600], fontSize: 13),
        ),
        const SizedBox(height: 12),
        if (_preferredProviders.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: Text('No preferred mechanics saved yet.'),
          )
        else
          ..._preferredProviders.map((provider) {
            final id = (provider['id'] ?? '').toString();
            final name = (provider['name'] ?? 'Unnamed mechanic').toString();
            final type = (provider['type'] ?? '').toString();
            final address = (provider['address'] ?? '').toString();

            return Card(
              child: ListTile(
                leading: Icon(
                  Icons.star,
                  color: Theme.of(context).colorScheme.primary,
                ),
                title: Text(name),
                subtitle: Text(
                  [
                    type.replaceAll('_', ' '),
                    address,
                  ].where((value) => value.isNotEmpty).join(' • '),
                ),
                trailing: IconButton(
                  icon: const Icon(Icons.close),
                  tooltip: 'Remove',
                  onPressed: _savingPreferredId == id
                      ? null
                      : () => _removePreferredProvider(id),
                ),
              ),
            );
          }),
        const SizedBox(height: 24),
        Text(
          "Mechanics You've Used",
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 4),
        Text(
          'Built from the shop/mechanic name saved on maintenance records '
          'across your garage.',
          style: TextStyle(color: Colors.grey[600], fontSize: 13),
        ),
        const SizedBox(height: 12),
        if (_loadingPastProviders)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: Text('Loading service history…'),
          )
        else if (_pastProviders.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: Text(
              'No past mechanics yet. Add a shop/mechanic name the next '
              'time you log a maintenance entry.',
            ),
          )
        else
          ..._pastProviders.map((provider) {
            final name = provider['name'] as String;
            final serviceCount = provider['serviceCount'] as int;
            final lastDate = provider['lastServiceDate'] as DateTime?;
            final isPreferred = _preferredProviders.any(
              (p) => p['name'].toString().toLowerCase() == name.toLowerCase(),
            );

            return Card(
              child: ListTile(
                title: Text(name),
                subtitle: Text(
                  '$serviceCount service${serviceCount == 1 ? '' : 's'}'
                  '${lastDate != null ? ' • Last ${lastDate.month}/${lastDate.day}/${lastDate.year}' : ''}',
                ),
                trailing: isPreferred
                    ? const Icon(Icons.star, color: Colors.grey)
                    : IconButton(
                        icon: const Icon(Icons.star_border),
                        tooltip: 'Save as preferred',
                        onPressed: () => _addPreferredProvider({
                          'id': 'used-${name.toLowerCase().replaceAll(RegExp(r'\s+'), '-')}',
                          'name': name,
                          'type': 'repair_shop',
                        }),
                      ),
              ),
            );
          }),
      ],
    );
  }
}
