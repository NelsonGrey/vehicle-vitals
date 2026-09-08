import { evaluatePassword, type PasswordPolicyState } from '../shared/usePasswordPolicy';

// Live, per-rule feedback for a password field -- replaces the old static
// "Must be at least 8 characters, including..." hint sentence with a
// checklist that fills in as each rule is met, so the policy is never
// ambiguous. Rows are driven entirely by `policy`, so a rule the live
// Firebase policy doesn't actually require (e.g. symbols) simply doesn't
// render a row, rather than the label list being hardcoded to today's
// specific policy.
export default function PasswordRequirementsChecklist({
  password,
  policy,
}: {
  password: string;
  policy: PasswordPolicyState;
}) {
  const results = evaluatePassword(password, policy);
  const rows: Array<{ met: boolean; label: string }> = [
    { met: results.meetsLength, label: `At least ${policy.minLength} characters` },
  ];
  if (policy.requiresUpper) {
    rows.push({ met: results.hasUpper, label: 'One uppercase letter' });
  }
  if (policy.requiresLower) {
    rows.push({ met: results.hasLower, label: 'One lowercase letter' });
  }
  if (policy.requiresDigit) {
    rows.push({ met: results.hasDigit, label: 'One number' });
  }
  if (policy.requiresSymbol) {
    rows.push({ met: results.hasSymbol, label: 'One special character' });
  }

  return (
    <ul className="mt-1 space-y-0.5 list-none p-0">
      {rows.map(({ met, label }) => (
        <li
          key={label}
          className={`flex items-center gap-1.5 text-xs ${
            met
              ? 'text-slate-600 dark:text-slate-300'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className={`h-3.5 w-3.5 flex-none ${
              met ? 'text-accent-600 dark:text-accent-500' : 'text-slate-300 dark:text-slate-600'
            }`}
          >
            {met ? (
              <path
                fill="currentColor"
                d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0Zm3.7 6.2-4 4a.75.75 0 0 1-1.06 0l-2-2a.75.75 0 1 1 1.06-1.06l1.47 1.47 3.47-3.47a.75.75 0 1 1 1.06 1.06Z"
              />
            ) : (
              <circle
                cx="8"
                cy="8"
                r="7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            )}
          </svg>
          {label}
        </li>
      ))}
    </ul>
  );
}
