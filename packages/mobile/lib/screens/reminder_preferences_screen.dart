import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../components/safe_back_button.dart';

import '../services/firestore_service.dart';

class ReminderPreferencesScreen extends StatefulWidget {
  const ReminderPreferencesScreen({super.key});

  @override
  State<ReminderPreferencesScreen> createState() =>
      _ReminderPreferencesScreenState();
}

class _ReminderPreferencesScreenState extends State<ReminderPreferencesScreen> {
  static const int _minLeadDays = 1;
  static const int _maxLeadDays = 60;
  static const int _minDailyMiles = 5;
  static const int _maxDailyMiles = 200;

  int _preferredLeadDays = 14;
  int _preferredDailyMiles = 35;
  bool _loading = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    try {
      final prefs = await context.read<FirestoreService>().getPreferences();
      final leadDays = (prefs['preferredReminderTimingDays'] as num?)?.toInt();
      final dailyMiles = (prefs['preferredDailyMiles'] as num?)?.toInt();

      if (!mounted) return;

      setState(() {
        if (leadDays != null) {
          _preferredLeadDays = leadDays.clamp(_minLeadDays, _maxLeadDays);
        }
        if (dailyMiles != null) {
          _preferredDailyMiles = dailyMiles.clamp(
            _minDailyMiles,
            _maxDailyMiles,
          );
        }
        _loading = false;
      });
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _loading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Unable to load reminder preferences: $error')),
      );
    }
  }

  Future<void> _savePreferences() async {
    setState(() {
      _saving = true;
    });

    try {
      await context.read<FirestoreService>().updatePreferences({
        'preferredReminderTimingDays': _preferredLeadDays,
        'preferredDailyMiles': _preferredDailyMiles,
      });

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Reminder preferences saved.')),
      );
    } catch (error) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to save reminder preferences: $error')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _saving = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Reminder Preferences'),
        leading: const SafeBackButton(fallbackRoute: '/app/settings'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Reminder Lead Time',
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Notify me $_preferredLeadDays day(s) before service is due.',
                        ),
                        Slider(
                          value: _preferredLeadDays.toDouble(),
                          min: _minLeadDays.toDouble(),
                          max: _maxLeadDays.toDouble(),
                          divisions: _maxLeadDays - _minLeadDays,
                          label: '$_preferredLeadDays days',
                          onChanged: _saving
                              ? null
                              : (value) {
                                  setState(() {
                                    _preferredLeadDays = value.round();
                                  });
                                },
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Driving Profile',
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Estimated usage: $_preferredDailyMiles miles/day',
                        ),
                        Slider(
                          value: _preferredDailyMiles.toDouble(),
                          min: _minDailyMiles.toDouble(),
                          max: _maxDailyMiles.toDouble(),
                          divisions: _maxDailyMiles - _minDailyMiles,
                          label: '$_preferredDailyMiles mi/day',
                          onChanged: _saving
                              ? null
                              : (value) {
                                  setState(() {
                                    _preferredDailyMiles = value.round();
                                  });
                                },
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                ElevatedButton.icon(
                  onPressed: _saving ? null : _savePreferences,
                  icon: _saving
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.save),
                  label: const Text('Save Preferences'),
                ),
              ],
            ),
    );
  }
}
