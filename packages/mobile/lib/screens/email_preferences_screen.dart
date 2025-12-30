import 'package:flutter/material.dart';

import '../services/email_reminder_service.dart';

class EmailPreferencesScreen extends StatefulWidget {
  const EmailPreferencesScreen({super.key});

  @override
  State<EmailPreferencesScreen> createState() => _EmailPreferencesScreenState();
}

class _EmailPreferencesScreenState extends State<EmailPreferencesScreen> {
  final EmailReminderService _emailService = EmailReminderService();
  bool _emailRemindersEnabled = true;
  bool _isLoading = true;
  bool _isSaving = false;
  String _userEmail = '';

  @override
  void initState() {
    super.initState();
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    try {
      final preferences = await _emailService.getEmailPreferences();
      setState(() {
        _emailRemindersEnabled = preferences['emailRemindersEnabled'];
        _userEmail = preferences['email'];
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading preferences: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
      setState(() => _isLoading = false);
    }
  }

  Future<void> _savePreferences() async {
    setState(() => _isSaving = true);

    try {
      await _emailService.updateEmailPreferences(_emailRemindersEnabled);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Email preferences saved successfully!'),
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

  Future<void> _sendTestReminder() async {
    setState(() => _isSaving = true);

    try {
      await _emailService.sendTestReminder();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Test reminder sent successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error sending test reminder: ${e.toString()}'),
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
        appBar: AppBar(title: const Text('Email Preferences')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Email Preferences'),
        actions: [
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
            // Email address display
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Email Address',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _userEmail.isNotEmpty
                          ? _userEmail
                          : 'No email address available',
                      style: TextStyle(
                        fontSize: 16,
                        color: _userEmail.isNotEmpty
                            ? Colors.black
                            : Colors.grey,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Email reminders toggle
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Maintenance Reminders',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Receive email notifications for upcoming vehicle maintenance based on manufacturer recommendations and your maintenance history.',
                      style: TextStyle(fontSize: 14, color: Colors.grey),
                    ),
                    const SizedBox(height: 16),
                    SwitchListTile(
                      title: const Text('Enable Email Reminders'),
                      subtitle: const Text(
                        'Daily checks for upcoming maintenance',
                      ),
                      value: _emailRemindersEnabled,
                      onChanged: (value) {
                        setState(() => _emailRemindersEnabled = value);
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Test reminder button
            if (_emailRemindersEnabled && _userEmail.isNotEmpty)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _isSaving ? null : _sendTestReminder,
                  icon: _isSaving
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.send),
                  label: const Text('Send Test Reminder'),
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
              'Email reminders are sent daily at 9 AM for maintenance items due within 30 days. You can disable this at any time.',
              style: TextStyle(fontSize: 12, color: Colors.grey),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
