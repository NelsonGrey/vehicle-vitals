import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { PasswordValidationStatus } from 'firebase/auth';
import AppOfflineNotice from '../components/AppOfflineNotice';
import { useAuth } from '../shared/AuthContext';
import { getRedirectQueryParam, withRedirect } from '../shared/authRedirect';
import { useAppOffline } from '../shared/useAppOffline';
import { userFacingError } from '../shared/userFacingError';

// Defaults match today's enforced Firebase password policy so the form is
// still usable if the live policy fetch fails (e.g. offline); the
// authoritative check in onSubmit re-verifies against the real policy
// regardless of whether this fetch succeeded.
interface PasswordPolicyState {
  minLength: number;
  requiresUpper: boolean;
  requiresLower: boolean;
  requiresDigit: boolean;
  requiresSymbol: boolean;
}

const DEFAULT_POLICY: PasswordPolicyState = {
  minLength: 8,
  requiresUpper: true,
  requiresLower: true,
  requiresDigit: true,
  requiresSymbol: true,
};

function passwordRequirementsHint(policy: PasswordPolicyState): string {
  const requirements = [
    policy.requiresUpper && 'an uppercase letter',
    policy.requiresLower && 'a lowercase letter',
    policy.requiresDigit && 'a number',
    policy.requiresSymbol && 'a symbol',
  ].filter(Boolean) as string[];
  if (requirements.length === 0) {
    return `Must be at least ${policy.minLength} characters long`;
  }
  return `Must be at least ${policy.minLength} characters, including ${requirements.join(', ')}`;
}

// Quick pass using the cached live policy, for immediate feedback without a
// network round-trip. onSubmit re-validates authoritatively against
// Firebase itself before signing up, so this never needs to be the last
// word on whether a password is accepted.
function quickPasswordCheck(password: string, policy: PasswordPolicyState): string | null {
  if (password.length < policy.minLength) {
    return `Password must be at least ${policy.minLength} characters long.`;
  }
  if (policy.requiresUpper && !/[A-Z]/.test(password)) {
    return 'Password must include an uppercase letter.';
  }
  if (policy.requiresLower && !/[a-z]/.test(password)) {
    return 'Password must include a lowercase letter.';
  }
  if (policy.requiresDigit && !/[0-9]/.test(password)) {
    return 'Password must include a number.';
  }
  if (policy.requiresSymbol && !/[^A-Za-z0-9]/.test(password)) {
    return 'Password must include a symbol (e.g. ! @ # ?).';
  }
  return null;
}

function describePasswordPolicyFailure(status: PasswordValidationStatus, policy: PasswordPolicyState): string {
  const missing = [
    status.meetsMinPasswordLength === false && `be at least ${policy.minLength} characters`,
    status.containsUppercaseLetter === false && 'include an uppercase letter',
    status.containsLowercaseLetter === false && 'include a lowercase letter',
    status.containsNumericCharacter === false && 'include a number',
    status.containsNonAlphanumericCharacter === false && 'include a symbol',
  ].filter(Boolean) as string[];
  if (missing.length === 0) {
    return 'Password does not meet the requirements for this account.';
  }
  return `Password must ${missing.join(', ')}.`;
}

export default function SignUp() {
  const { signUp, signInWithGoogle, signInWithApple, checkPasswordPolicy } = useAuth();
  const isAppOffline = useAppOffline();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [policy, setPolicy] = useState<PasswordPolicyState>(DEFAULT_POLICY);
  const navigate = useNavigate();
  const location = useLocation();
  const redirect = getRedirectQueryParam(location.search);

  useEffect(() => {
    let cancelled = false;
    // A throwaway non-empty candidate -- only .passwordPolicy is used here,
    // not whether this specific placeholder is valid.
    checkPasswordPolicy(' ')
      .then((status) => {
        if (cancelled) return;
        const options = status.passwordPolicy.customStrengthOptions;
        setPolicy({
          minLength: options.minPasswordLength ?? DEFAULT_POLICY.minLength,
          requiresUpper: options.containsUppercaseLetter ?? false,
          requiresLower: options.containsLowercaseLetter ?? false,
          requiresDigit: options.containsNumericCharacter ?? false,
          requiresSymbol: options.containsNonAlphanumericCharacter ?? false,
        });
      })
      .catch(() => {
        // Keep DEFAULT_POLICY -- onSubmit still authoritatively re-checks
        // the real password against the live policy at submit time.
      });
    return () => {
      cancelled = true;
    };
  }, [checkPasswordPolicy]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Quick client-side pass using the cached live policy.
    const quickCheckError = quickPasswordCheck(password, policy);
    if (quickCheckError) {
      setError(quickCheckError);
      return;
    }

    setBusy(true);
    try {
      // Authoritative check against the live Firebase policy -- catches
      // drift between this form's cached copy and the real policy (e.g. it
      // changed after this form loaded, or the initial fetch failed)
      // before spending a round-trip on account creation.
      const status = await checkPasswordPolicy(password);
      if (!status.isValid) {
        setError(describePasswordPolicyFailure(status, policy));
        return;
      }

      await signUp(email, password);
      navigate(redirect, { replace: true });
    } catch (err: unknown) {
      setError(
        userFacingError(
          err,
          'We could not create your account. Please try again or visit Support.'
        )
      );
    } finally {
      setBusy(false);
    }
  };

  if (isAppOffline) {
    return <AppOfflineNotice />;
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
      <h1 className="font-serif font-bold text-3xl text-slate-900 dark:text-slate-100 mb-2 text-center">
        Create your account
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mb-6 text-center">
        Set up your secure account and start managing your vehicle records.
      </p>
      {error && (
        <div
          className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded mb-4"
          role="alert"
        >
          {error}
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="mb-6">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="w-full px-3 py-2 pr-24 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(value => !value)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:underline"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {passwordRequirementsHint(policy)}
          </p>
        </div>
        <div className="mb-6">
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
          >
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              className="w-full px-3 py-2 pr-24 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(value => !value)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:underline"
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <button
          type="submit"
          className="w-full px-4 py-2.5 bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900 rounded-lg border border-slate-700 dark:border-slate-300 hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
          disabled={busy}
        >
          {busy ? 'Creating account…' : 'Create Account'}
        </button>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            className="border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:bg-slate-100 text-slate-700 dark:text-slate-200 font-medium py-2 px-4 rounded-md transition-colors duration-200"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError('');
              try {
                await signInWithGoogle();
                navigate(redirect, { replace: true });
              } catch (err: unknown) {
                const error = err as Error;
                setError(
                  userFacingError(
                    error,
                    'Google sign-up could not be completed. Please try again.'
                  )
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            Continue with Google
          </button>
          <button
            type="button"
            className="border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:bg-slate-100 text-slate-700 dark:text-slate-200 font-medium py-2 px-4 rounded-md transition-colors duration-200"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError('');
              try {
                await signInWithApple();
                navigate(redirect, { replace: true });
              } catch (err: unknown) {
                const error = err as Error;
                setError(
                  userFacingError(
                    error,
                    'Apple sign-up could not be completed. Please try again.'
                  )
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            Continue with Apple
          </button>
        </div>
      </form>
      <p className="mt-4 text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
        By creating an account or continuing with Google or Apple, you agree to
        our{' '}
        <Link
          to="/terms"
          className="underline hover:text-slate-700 dark:hover:text-slate-200"
        >
          Terms of Use
        </Link>{' '}
        and acknowledge our{' '}
        <Link
          to="/privacy"
          className="underline hover:text-slate-700 dark:hover:text-slate-200"
        >
          Privacy Policy
        </Link>
        .
      </p>
      <p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-400">
        Already have an account?{' '}
        <Link
          to={withRedirect('/auth/login', redirect)}
          className="text-slate-700 dark:text-slate-300 hover:underline font-medium"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
