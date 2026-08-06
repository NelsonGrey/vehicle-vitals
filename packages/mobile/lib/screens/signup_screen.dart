import 'dart:io' show Platform;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../components/app_logo.dart';
import '../services/auth_service.dart';
import '../services/password_policy_service.dart';
import '../utils/user_facing_error.dart';

class SignUpScreen extends StatefulWidget {
  const SignUpScreen({super.key});

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isLoading = false;
  bool _showPassword = false;
  bool _showConfirmPassword = false;

  final _passwordPolicyService = PasswordPolicyService();

  // Populated from the live Firebase password policy (see
  // PasswordPolicyService.loadPolicy). Defaults to PasswordPolicyService's
  // fallback so the form is still usable if the fetch fails (e.g. offline);
  // the authoritative check in _signUp() re-verifies against the real
  // policy regardless of whether this fetch succeeded.
  PasswordPolicyState _policy = PasswordPolicyService.defaultPolicy;

  @override
  void initState() {
    super.initState();
    _loadPasswordPolicy();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _loadPasswordPolicy() async {
    final policy = await _passwordPolicyService.loadPolicy();
    if (!mounted) return;
    setState(() => _policy = policy);
  }

  Future<void> _signUp() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final authService = Provider.of<AuthService>(context, listen: false);
      final password = _passwordController.text;

      // Authoritative check against the live Firebase policy -- catches
      // drift between this form's cached copy and the real policy (e.g.
      // it changed after this screen loaded, or the initial fetch failed)
      // before spending a round-trip on account creation.
      final status = await _passwordPolicyService.checkPassword(password);
      if (!status.isValid) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                _passwordPolicyService.describeFailure(status, _policy),
              ),
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
          );
        }
        return;
      }

      await authService.createUserWithEmailAndPassword(
        _emailController.text.trim(),
        password,
      );

      if (mounted) {
        context.go('/app');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              userFacingError(
                e,
                fallback:
                    'We could not create your account. Please try again or visit Support.',
              ),
            ),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _signInWithGoogle() async {
    setState(() => _isLoading = true);

    try {
      final authService = Provider.of<AuthService>(context, listen: false);
      final credential = await authService.signInWithGoogle();

      if (mounted && credential != null) {
        context.go('/app');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              userFacingError(
                e,
                fallback:
                    'Google sign-in could not be completed. Please try again.',
              ),
            ),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _signInWithApple() async {
    setState(() => _isLoading = true);

    try {
      final authService = Provider.of<AuthService>(context, listen: false);
      await authService.signInWithApple();

      if (mounted) {
        context.go('/app');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              userFacingError(
                e,
                fallback:
                    'Apple sign-in could not be completed. Please try again.',
              ),
            ),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create Account')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Create your account',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 6),
                Text(
                  'Use one secure account for web and iOS access.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 20),
                Padding(
                  padding: const EdgeInsets.only(bottom: 20),
                  child: Center(
                    child: AppLogo(size: 72, showText: false, full: true),
                  ),
                ),

                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        TextFormField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          decoration: const InputDecoration(
                            labelText: 'Email address',
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Please enter your email';
                            }
                            if (!value.contains('@')) {
                              return 'Please enter a valid email';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _passwordController,
                          obscureText: !_showPassword,
                          decoration: InputDecoration(
                            labelText: 'Password',
                            helperText: _passwordPolicyService.hint(_policy),
                            helperMaxLines: 2,
                            suffixIcon: IconButton(
                              onPressed: () => setState(
                                () => _showPassword = !_showPassword,
                              ),
                              icon: Icon(
                                _showPassword
                                    ? Icons.visibility_off
                                    : Icons.visibility,
                              ),
                              tooltip: _showPassword
                                  ? 'Hide password'
                                  : 'Show password',
                            ),
                          ),
                          validator: (value) => _passwordPolicyService
                              .quickCheck(value ?? '', _policy),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _confirmPasswordController,
                          obscureText: !_showConfirmPassword,
                          decoration: InputDecoration(
                            labelText: 'Confirm password',
                            suffixIcon: IconButton(
                              onPressed: () => setState(
                                () => _showConfirmPassword =
                                    !_showConfirmPassword,
                              ),
                              icon: Icon(
                                _showConfirmPassword
                                    ? Icons.visibility_off
                                    : Icons.visibility,
                              ),
                              tooltip: _showConfirmPassword
                                  ? 'Hide password'
                                  : 'Show password',
                            ),
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Please confirm your password';
                            }
                            if (value != _passwordController.text) {
                              return 'Passwords do not match';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _isLoading ? null : _signUp,
                          child: _isLoading
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Text('Create Account'),
                        ),
                        const SizedBox(height: 8),
                        OutlinedButton.icon(
                          onPressed: _isLoading ? null : _signInWithGoogle,
                          icon: const Icon(Icons.g_mobiledata),
                          label: const Text('Continue with Google'),
                        ),
                        if (Platform.isIOS) ...[
                          const SizedBox(height: 8),
                          OutlinedButton.icon(
                            onPressed: _isLoading ? null : _signInWithApple,
                            icon: const Icon(Icons.apple),
                            label: const Text('Continue with Apple'),
                          ),
                        ],
                        const SizedBox(height: 12),
                        const Text(
                          'By creating an account or continuing with Google or Apple, you agree to the Terms of Use and acknowledge the Privacy Policy.',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 12, color: Colors.black54),
                        ),
                        Wrap(
                          alignment: WrapAlignment.center,
                          children: [
                            TextButton(
                              onPressed: () => context.push('/terms'),
                              child: const Text('Terms of Use'),
                            ),
                            TextButton(
                              onPressed: () => context.push('/privacy'),
                              child: const Text('Privacy Policy'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                TextButton(
                  onPressed: () => context.go('/auth/login'),
                  child: const Text('Already have an account? Sign in'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
