import 'package:firebase_auth/firebase_auth.dart' show PasswordValidationStatus;
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../components/app_logo.dart';
import '../services/auth_service.dart';
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

  // Populated from the live Firebase password policy (see
  // AuthService.validatePassword). These defaults match today's enforced
  // policy so the form is still usable if the fetch fails (e.g. offline);
  // the authoritative check in _signUp() re-verifies against the real
  // policy regardless of whether this fetch succeeded.
  int _policyMinLength = 8;
  bool _policyRequiresUpper = true;
  bool _policyRequiresLower = true;
  bool _policyRequiresDigit = true;
  bool _policyRequiresSymbol = true;

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
    try {
      final authService = Provider.of<AuthService>(context, listen: false);
      // A throwaway non-empty candidate -- only .passwordPolicy is used
      // here, not whether this specific placeholder is valid.
      final status = await authService.validatePassword(' ');
      final policy = status.passwordPolicy;
      if (!mounted) return;
      setState(() {
        _policyMinLength = policy.minPasswordLength;
        // A null field means Firebase doesn't enforce that character class
        // for this policy -- default to not-required, not required, or the
        // client would reject passwords the server actually accepts.
        _policyRequiresUpper = policy.containsUppercaseCharacter ?? false;
        _policyRequiresLower = policy.containsLowercaseCharacter ?? false;
        _policyRequiresDigit = policy.containsNumericCharacter ?? false;
        _policyRequiresSymbol = policy.containsNonAlphanumericCharacter ?? false;
      });
    } catch (_) {
      // Keep the defaults above -- _signUp() still authoritatively
      // re-checks the real password against the live policy at submit time.
    }
  }

  String _passwordRequirementsHint() {
    final requirements = <String>[
      if (_policyRequiresUpper) 'upper',
      if (_policyRequiresLower) 'lower',
      if (_policyRequiresDigit) 'number',
      if (_policyRequiresSymbol) 'symbol',
    ];
    if (requirements.isEmpty) {
      return '$_policyMinLength+ characters';
    }
    return '$_policyMinLength+ characters with ${requirements.join(', ')}';
  }

  // Client-side pass using the cached live policy so users get immediate
  // feedback while typing. _signUp() re-validates authoritatively against
  // Firebase itself before submitting, so this never needs to be the last
  // word on whether a password is accepted.
  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please enter a password';
    }
    if (value.length < _policyMinLength) {
      return 'Password must be at least $_policyMinLength characters';
    }
    if (_policyRequiresUpper && !value.contains(RegExp(r'[A-Z]'))) {
      return 'Password must include an uppercase letter';
    }
    if (_policyRequiresLower && !value.contains(RegExp(r'[a-z]'))) {
      return 'Password must include a lowercase letter';
    }
    if (_policyRequiresDigit && !value.contains(RegExp(r'[0-9]'))) {
      return 'Password must include a number';
    }
    if (_policyRequiresSymbol && !value.contains(RegExp(r'[^A-Za-z0-9]'))) {
      return 'Password must include a symbol (e.g. ! @ # ?)';
    }
    return null;
  }

  String _describePasswordFailure(PasswordValidationStatus status) {
    final missing = <String>[
      if (!status.meetsMinPasswordLength)
        'be at least $_policyMinLength characters',
      if (!status.meetsUppercaseRequirement) 'include an uppercase letter',
      if (!status.meetsLowercaseRequirement) 'include a lowercase letter',
      if (!status.meetsDigitsRequirement) 'include a number',
      if (!status.meetsSymbolsRequirement) 'include a symbol',
    ];
    if (missing.isEmpty) {
      return 'Password does not meet the requirements for this account.';
    }
    return 'Password must ${missing.join(', ')}.';
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
      final status = await authService.validatePassword(password);
      if (!status.isValid) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(_describePasswordFailure(status)),
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
                            helperText: _passwordRequirementsHint(),
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
                          validator: _validatePassword,
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
                          onPressed: _isLoading ? null : _signInWithApple,
                          icon: const Icon(Icons.apple),
                          label: const Text('Continue with Apple'),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'By creating an account or continuing with Apple, you agree to the Terms of Use and acknowledge the Privacy Policy.',
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
