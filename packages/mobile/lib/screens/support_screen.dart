import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/material.dart';

import '../components/safe_back_button.dart';
import '../theme/design_tokens.dart';
import '../utils/user_facing_error.dart';

const List<String> kSupportRequestTopics = [
  'Bug Report',
  'Account / Login',
  'Billing / Subscription',
  'VIN Lookup / Vehicle Data',
  'Feature Request',
  'Other',
];

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _messageController = TextEditingController();
  String? _topic;
  bool _submitting = false;
  bool _submitted = false;
  String? _error;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final functions = FirebaseFunctions.instanceFor(region: 'us-central1');
      await functions.httpsCallable('submitSupportRequestCallable').call({
        'name': _nameController.text.trim(),
        'email': _emailController.text.trim(),
        'topic': _topic,
        'message': _messageController.text.trim(),
      });

      if (!mounted) {
        return;
      }
      setState(() {
        _submitted = true;
        _nameController.clear();
        _emailController.clear();
        _messageController.clear();
        _topic = null;
      });
    } on FirebaseFunctionsException catch (e) {
      if (!mounted) {
        return;
      }
      setState(
        () => _error = userFacingError(
          e,
          fallback:
              'Your message could not be sent. Check the form and try again.',
        ),
      );
    } catch (e) {
      if (!mounted) {
        return;
      }
      setState(() => _error = 'Failed to send your message');
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Support'),
        leading: const SafeBackButton(),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Send the details below and we will respond as soon as possible. Response times vary by request type and support availability.',
            ),
            const SizedBox(height: 20),
            if (_submitted)
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppDesignTokens.success.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppDesignTokens.success),
                ),
                child: const Text(
                  "Thanks — your message has been sent. We'll get back to "
                  'you soon.',
                  style: TextStyle(
                    color: AppDesignTokens.success,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              )
            else
              Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TextFormField(
                      controller: _nameController,
                      decoration: const InputDecoration(
                        labelText: 'Name',
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) =>
                          (value == null || value.trim().isEmpty)
                          ? 'Name is required'
                          : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(
                        labelText: 'Email',
                        border: OutlineInputBorder(),
                        hintText: 'you@example.com',
                      ),
                      validator: (value) {
                        final trimmed = value?.trim() ?? '';
                        final emailPattern = RegExp(
                          r'^[^\s@]+@[^\s@]+\.[^\s@]+$',
                        );
                        if (!emailPattern.hasMatch(trimmed)) {
                          return 'A valid email is required';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: _topic,
                      decoration: const InputDecoration(
                        labelText: 'Topic',
                        border: OutlineInputBorder(),
                      ),
                      hint: const Text('Select a topic…'),
                      items: kSupportRequestTopics
                          .map(
                            (topic) => DropdownMenuItem(
                              value: topic,
                              child: Text(topic),
                            ),
                          )
                          .toList(),
                      onChanged: (value) => setState(() => _topic = value),
                      validator: (value) =>
                          value == null ? 'A topic is required' : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _messageController,
                      minLines: 5,
                      maxLines: 8,
                      decoration: const InputDecoration(
                        labelText: 'Message',
                        alignLabelWithHint: true,
                        border: OutlineInputBorder(),
                        hintText:
                            'Describe your issue or question in as much '
                            'detail as possible…',
                      ),
                      validator: (value) =>
                          (value == null || value.trim().isEmpty)
                          ? 'A message is required'
                          : null,
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Theme.of(
                            context,
                          ).colorScheme.error.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          _error!,
                          style: TextStyle(
                            color: Theme.of(context).colorScheme.error,
                          ),
                        ),
                      ),
                    ],
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _submitting ? null : _submit,
                        child: _submitting
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text('Send Message'),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
