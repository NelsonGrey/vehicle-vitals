import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import '../components/brand_scaffold.dart';

import '../services/entitlements_service.dart';
import '../theme/design_tokens.dart';

/// Lets the signed-in account organize its garage as a shared household
/// garage. Mirrors web's AccountConsolidation.tsx "Household Garage"
/// section (packages/web/src/pages/AccountConsolidation.tsx:335-399) --
/// same status/promote flow, same "invitations not available yet"
/// disclosure, just its own screen rather than a settings-tab section,
/// since mobile has no equivalent combined account-consolidation page.
class HouseholdGarageScreen extends StatefulWidget {
  const HouseholdGarageScreen({super.key});

  @override
  State<HouseholdGarageScreen> createState() => _HouseholdGarageScreenState();
}

class _HouseholdGarageScreenState extends State<HouseholdGarageScreen> {
  final _entitlementsService = EntitlementsService();
  final _nameController = TextEditingController();

  bool _statusLoading = true;
  String? _orgType;
  String? _garageStorageMode;
  String? _householdName;
  bool _promoting = false;
  String? _error;
  String? _status;

  @override
  void initState() {
    super.initState();
    _loadStatus();
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _loadStatus() async {
    setState(() => _statusLoading = true);
    try {
      final context = await _entitlementsService.bootstrapEnterpriseContext();
      final orgId = context['orgId']?.toString();
      String? name;
      if (orgId != null && orgId.isNotEmpty) {
        // The callable doesn't return a display name -- mirrors web's
        // getHouseholdGarageStatus(), which does this same direct read.
        final orgSnap = await FirebaseFirestore.instance
            .doc('orgs/$orgId')
            .get();
        name = orgSnap.data()?['name']?.toString();
      }
      if (!mounted) return;
      setState(() {
        _orgType = context['orgType']?.toString();
        _garageStorageMode = context['garageStorageMode']?.toString();
        _householdName = name;
        if (name != null) _nameController.text = name;
        _statusLoading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _statusLoading = false);
    }
  }

  Future<void> _promote() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      setState(() => _error = 'Please name your household garage');
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Create household garage?'),
        content: const Text(
          'This will organize your personal garage as a household garage '
          'managed by this signed-in account. Your existing vehicles will '
          'be copied into it. You remain the owner and keep access to your '
          'personal garage.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Continue'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() {
      _error = null;
      _status = null;
      _promoting = true;
    });

    try {
      final result = await _entitlementsService
          .promotePersonalGarageToHousehold(householdName: name);
      if (!mounted) return;
      final vehiclesCopied = result['vehiclesCopied'] ?? 0;
      setState(() {
        _orgType = result['orgType']?.toString();
        _garageStorageMode = result['garageStorageMode']?.toString();
        _householdName = result['name']?.toString() ?? name;
        _status =
            '$_householdName is now a household garage. '
            '$vehiclesCopied vehicle(s) were copied into it.';
      });
    } catch (e) {
      if (!mounted) return;
      setState(
        () => _error =
            'The household garage could not be created. Please try again.',
      );
    } finally {
      if (mounted) setState(() => _promoting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return BrandScaffold(
      title: const Text('Household Garage'),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: _statusLoading
              ? const Center(
                  child: Padding(
                    padding: EdgeInsets.only(top: 40),
                    child: CircularProgressIndicator(),
                  ),
                )
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Organize the vehicles your household relies on in one '
                      'garage. This release keeps management with the '
                      'signed-in account; invitations and additional member '
                      'access are not yet available.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 16),
                    if (_status != null) ...[
                      _InfoBanner(text: _status!, isError: false),
                      const SizedBox(height: 12),
                    ],
                    if (_error != null) ...[
                      _InfoBanner(text: _error!, isError: true),
                      const SizedBox(height: 12),
                    ],
                    if (_orgType == 'household')
                      _HouseholdStatusCard(
                        name: _householdName ?? 'Household Garage',
                        garageStorageMode: _garageStorageMode,
                      )
                    else
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              TextField(
                                controller: _nameController,
                                decoration: const InputDecoration(
                                  labelText: 'Household garage name',
                                  hintText: 'e.g. The Nelson Household',
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Your existing vehicles will be copied into '
                                'the household garage. You remain the owner '
                                'and keep access to your personal garage.',
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                              const SizedBox(height: 16),
                              ElevatedButton(
                                onPressed: _promoting ? null : _promote,
                                child: _promoting
                                    ? const SizedBox(
                                        height: 20,
                                        width: 20,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          color: Colors.white,
                                        ),
                                      )
                                    : const Text('Create Household Garage'),
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
        ),
      ),
    );
  }
}

class _HouseholdStatusCard extends StatelessWidget {
  const _HouseholdStatusCard({required this.name, this.garageStorageMode});

  final String name;
  final String? garageStorageMode;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final modeLabel = garageStorageMode == 'org_scoped'
        ? 'Household garage'
        : 'Household garage (migration in progress)';
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '$name is a household garage managed by this account.',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: colorScheme.primary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Storage mode: $modeLabel',
              style: const TextStyle(fontSize: 12),
            ),
            const SizedBox(height: 8),
            Text(
              'Additional member invitations are not available in this '
              'release. This household garage is currently managed from '
              'the signed-in account.',
              style: TextStyle(
                fontSize: 12,
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoBanner extends StatelessWidget {
  const _InfoBanner({required this.text, required this.isError});

  final String text;
  final bool isError;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final color = isError ? colorScheme.error : AppDesignTokens.success;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(text, style: TextStyle(color: color)),
    );
  }
}
