import 'package:flutter/material.dart';

import '../services/calendar_service.dart';

class CalendarPreferencesScreen extends StatefulWidget {
  const CalendarPreferencesScreen({super.key});

  @override
  State<CalendarPreferencesScreen> createState() =>
      _CalendarPreferencesScreenState();
}

class _CalendarPreferencesScreenState extends State<CalendarPreferencesScreen> {
  final CalendarService _calendarService = CalendarService();
  bool _calendarSyncEnabled = false;
  bool _isLoading = true;
  bool _isSaving = false;
  bool _hasPermissions = false;
  String? _selectedCalendarId;
  List<Map<String, dynamic>> _availableCalendars = const [];

  @override
  void initState() {
    super.initState();
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    setState(() => _isLoading = true);

    try {
      // Check permissions
      _hasPermissions = await _calendarService.hasCalendarPermissions();

      if (_hasPermissions) {
        final calendars = await _calendarService.getAvailableCalendars();
        _availableCalendars = calendars
            .map((c) => Map<String, dynamic>.from(c as Map))
            .toList();

        // Load user preferences
        final preferences = await _calendarService.getCalendarPreferences();
        _calendarSyncEnabled = preferences['calendarSyncEnabled'];
        _selectedCalendarId = preferences['calendarId'];

        if (_selectedCalendarId == null && _availableCalendars.isNotEmpty) {
          _selectedCalendarId = _availableCalendars.first['id']?.toString();
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Error loading calendar preferences: ${e.toString()}',
            ),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _requestPermissions() async {
    setState(() => _isSaving = true);

    try {
      final granted = await _calendarService.requestCalendarPermissions();
      if (granted) {
        await _loadPreferences(); // Reload everything
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Calendar permissions granted!'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Calendar permissions denied. Please enable in settings.',
              ),
              backgroundColor: Colors.orange,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error requesting permissions: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() => _isSaving = false);
    }
  }

  Future<void> _savePreferences() async {
    setState(() => _isSaving = true);

    try {
      await _calendarService.updateCalendarPreferences(
        _calendarSyncEnabled,
        calendarId: _selectedCalendarId,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Calendar preferences saved successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error saving preferences: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() => _isSaving = false);
    }
  }

  Future<void> _syncMaintenanceToCalendar() async {
    setState(() => _isSaving = true);

    try {
      final eventsAdded = await _calendarService
          .syncUpcomingMaintenanceToCalendar();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Successfully added $eventsAdded maintenance events to calendar!',
            ),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error syncing to calendar: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Calendar Preferences')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Calendar Preferences'),
        actions: [
          if (_hasPermissions)
            TextButton(
              onPressed: _isSaving ? null : _savePreferences,
              child: _isSaving
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Save'),
            ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Permissions status
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Calendar Access',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(
                          _hasPermissions ? Icons.check_circle : Icons.error,
                          color: _hasPermissions ? Colors.green : Colors.red,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          _hasPermissions
                              ? 'Calendar access granted'
                              : 'Calendar access required',
                          style: TextStyle(
                            color: _hasPermissions ? Colors.green : Colors.red,
                          ),
                        ),
                      ],
                    ),
                    if (!_hasPermissions) ...[
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _isSaving ? null : _requestPermissions,
                          child: const Text('Grant Calendar Access'),
                        ),
                      ),
                    ],
                    if (_hasPermissions)
                      const Text(
                        'Calendar is connected through backend event links.',
                        style: TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                  ],
                ),
              ),
            ),

            if (_hasPermissions) ...[
              const SizedBox(height: 24),

              // Calendar sync toggle
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Maintenance Sync',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Automatically sync upcoming maintenance reminders to your calendar.',
                        style: TextStyle(fontSize: 14, color: Colors.grey),
                      ),
                      const SizedBox(height: 16),
                      SwitchListTile(
                        title: const Text('Enable Calendar Sync'),
                        subtitle: const Text(
                          'Add maintenance events to calendar',
                        ),
                        value: _calendarSyncEnabled,
                        onChanged: (value) {
                          setState(() => _calendarSyncEnabled = value);
                        },
                      ),
                      if (_calendarSyncEnabled) ...[
                        const SizedBox(height: 8),
                        DropdownButtonFormField<String>(
                          initialValue: _selectedCalendarId,
                          decoration: const InputDecoration(
                            labelText: 'Default Calendar Target',
                            border: OutlineInputBorder(),
                          ),
                          items: _availableCalendars
                              .map(
                                (c) => DropdownMenuItem<String>(
                                  value: c['id']?.toString(),
                                  child: Text(c['name']?.toString() ?? ''),
                                ),
                              )
                              .toList(),
                          onChanged: (value) {
                            setState(() => _selectedCalendarId = value);
                          },
                        ),
                      ],
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Manual sync button
              if (_calendarSyncEnabled)
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _isSaving ? null : _syncMaintenanceToCalendar,
                    icon: _isSaving
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.sync),
                    label: const Text('Sync Upcoming Maintenance'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFF59E0B),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                  ),
                ),

              const Spacer(),

              // Information text
              const Text(
                'Use Upcoming Tasks to create calendar events with your selected target.',
                style: TextStyle(fontSize: 12, color: Colors.grey),
                textAlign: TextAlign.center,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
