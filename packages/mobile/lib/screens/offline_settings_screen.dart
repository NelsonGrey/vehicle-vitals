import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/offline_service.dart';

class OfflineSettingsScreen extends StatefulWidget {
  const OfflineSettingsScreen({super.key});

  @override
  State<OfflineSettingsScreen> createState() => _OfflineSettingsScreenState();
}

class _OfflineSettingsScreenState extends State<OfflineSettingsScreen> {
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Offline Settings')),
      body: Consumer<OfflineService>(
        builder: (context, offlineService, child) {
          return Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Offline Mode',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Enable offline mode to access your data without an internet connection. Changes will sync when you reconnect.',
                          style: TextStyle(fontSize: 14, color: Colors.grey),
                        ),
                        const SizedBox(height: 16),
                        SwitchListTile(
                          title: const Text('Enable Offline Access'),
                          subtitle: const Text(
                            'Store data locally for offline use',
                          ),
                          value: offlineService.isOfflineEnabled,
                          onChanged: _isLoading
                              ? null
                              : (value) =>
                                    _toggleOfflineMode(offlineService, value),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Connection Status',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Icon(
                              offlineService.isOnline
                                  ? Icons.wifi
                                  : Icons.wifi_off,
                              color: offlineService.isOnline
                                  ? Colors.green
                                  : Colors.orange,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              offlineService.isOnline ? 'Online' : 'Offline',
                              style: TextStyle(
                                color: offlineService.isOnline
                                    ? Colors.green
                                    : Colors.orange,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          offlineService.isOnline
                              ? 'You are connected to the internet. All changes sync automatically.'
                              : 'You are offline. Changes will sync when you reconnect.',
                          style: const TextStyle(
                            fontSize: 14,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                if (offlineService.isOfflineEnabled)
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Data Management',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'Advanced options for managing offline data.',
                            style: TextStyle(fontSize: 14, color: Colors.grey),
                          ),
                          const SizedBox(height: 16),
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton.icon(
                              onPressed: _isLoading
                                  ? null
                                  : () => _syncData(offlineService),
                              icon: const Icon(Icons.sync),
                              label: const Text('Sync Pending Changes'),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                  vertical: 12,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton.icon(
                              onPressed: _isLoading
                                  ? null
                                  : () => _clearCache(offlineService),
                              icon: const Icon(Icons.cleaning_services),
                              label: const Text('Clear Local Cache'),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                  vertical: 12,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                const Spacer(),

                const Text(
                  'Offline mode stores your vehicle and maintenance data locally on your device. This allows you to view and edit data without an internet connection.',
                  style: TextStyle(fontSize: 12, color: Colors.grey),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<void> _toggleOfflineMode(
    OfflineService offlineService,
    bool enabled,
  ) async {
    setState(() => _isLoading = true);

    try {
      await offlineService.setOfflineEnabled(enabled);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              enabled
                  ? 'Offline mode enabled. Your data will be stored locally.'
                  : 'Offline mode disabled. You need internet to access your data.',
            ),
            backgroundColor: enabled ? Colors.green : Colors.blue,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update offline settings: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _syncData(OfflineService offlineService) async {
    setState(() => _isLoading = true);

    try {
      await offlineService.syncPendingChanges();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Data synced successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Sync failed: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _clearCache(OfflineService offlineService) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear Local Cache'),
        content: const Text(
          'This will remove all locally stored data. Make sure your changes are synced before proceeding. This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Clear Cache'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isLoading = true);

    try {
      await offlineService.clearCache();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Local cache cleared successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to clear cache: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }
}
