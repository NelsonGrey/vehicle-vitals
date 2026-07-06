import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/material.dart';

const List<String> kSupportRequestTopics = [
  'Bug Report',
  'Account / Login',
  'Billing / Subscription',
  'VIN Lookup / Vehicle Data',
  'Feature Request',
  'Other',
];

class ContactScreen extends StatefulWidget {
  const ContactScreen({super.key});

  @override
  State<ContactScreen> createState() => _ContactScreenState();
}

class _ContactScreenState extends State<ContactScreen> {
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
        () => _error = e.message ?? 'Failed to send your message',
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
      appBar: AppBar(title: const Text('Support')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Support',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            const Text('We typically respond within 24 hours.'),
            const SizedBox(height: 20),
            if (_submitted)
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.green.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.green),
                ),
                child: const Text(
                  "Thanks — your message has been sent. We'll get back to "
                  'you soon.',
                  style: TextStyle(
                    color: Colors.green,
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
                      validator: (value) => (value == null || value.trim().isEmpty)
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
                        final emailPattern = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
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
                      validator: (value) => (value == null || value.trim().isEmpty)
                          ? 'A message is required'
                          : null,
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.red.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          _error!,
                          style: const TextStyle(color: Colors.red),
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
