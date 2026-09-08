import 'package:flutter/material.dart';

import '../services/password_policy_service.dart';
import '../theme/design_tokens.dart';

/// Live, per-rule feedback for a password field -- replaces the old static
/// "8+ characters with upper, lower, number, symbol" hint sentence with a
/// checklist that fills in as each rule is met, so the policy is never
/// ambiguous. Rows are driven entirely by [policy], so a rule the live
/// Firebase policy doesn't actually require (e.g. symbols) simply doesn't
/// render a row, rather than the label list being hardcoded to today's
/// specific policy.
class PasswordRequirementsChecklist extends StatelessWidget {
  const PasswordRequirementsChecklist({
    super.key,
    required this.password,
    required this.policy,
  });

  final String password;
  final PasswordPolicyState policy;

  @override
  Widget build(BuildContext context) {
    final results = PasswordPolicyService().evaluate(password, policy);
    final rows = <(bool, String)>[
      (results.meetsLength, 'At least ${policy.minLength} characters'),
      if (policy.requiresUpper) (results.hasUpper, 'One uppercase letter'),
      if (policy.requiresLower) (results.hasLower, 'One lowercase letter'),
      if (policy.requiresDigit) (results.hasDigit, 'One number'),
      if (policy.requiresSymbol) (results.hasSymbol, 'One special character'),
    ];

    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (final (met, label) in rows)
            _RequirementRow(met: met, label: label),
        ],
      ),
    );
  }
}

class _RequirementRow extends StatelessWidget {
  const _RequirementRow({required this.met, required this.label});

  final bool met;
  final String label;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final color = met ? AppDesignTokens.success : colorScheme.outline;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 1),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            met ? Icons.check_circle : Icons.circle_outlined,
            size: 14,
            color: color,
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: met ? colorScheme.onSurfaceVariant : colorScheme.outline,
            ),
          ),
        ],
      ),
    );
  }
}
