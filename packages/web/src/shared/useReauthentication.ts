import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword as firebaseUpdatePassword,
  type User,
} from 'firebase/auth';

interface UseReauthenticationArgs {
  user: { email?: string | null } | null;
  reauthenticateWithGoogle: () => Promise<unknown>;
  reauthenticateWithApple: () => Promise<unknown>;
}

/**
 * Shared password/Google/Apple reauthentication used by the account-security
 * flows split out of the old monolithic Profile page (Change Password,
 * Privacy & Data Requests). Each caller supplies its own `currentPassword`
 * at call time rather than sharing one field across pages -- that coupling
 * (typing a password to change it also silently populating the account
 * deletion confirmation field) was a real bug in the unsplit page.
 *
 * Uses the modular `firebase/auth` SDK directly. An earlier version polled
 * a `window.firebase` compat global for up to 5s before falling back to a
 * no-op stub -- that global is never set anywhere in this app, so every
 * mount silently burned the full 5s timeout (and password changes/exports
 * silently no-op'd once it fell back).
 */
export function useReauthentication({
  user,
  reauthenticateWithGoogle,
  reauthenticateWithApple,
}: UseReauthenticationArgs) {
  const providerIds = (
    (user as { providerData?: Array<{ providerId: string }> } | null)
      ?.providerData || []
  ).map(provider => provider.providerId);
  const hasGoogle = providerIds.includes('google.com');
  const hasApple = providerIds.includes('apple.com');
  const hasPassword = providerIds.includes('password');

  const reauth = async (currentPassword: string) => {
    if (!hasPassword) {
      if (hasGoogle) {
        await reauthenticateWithGoogle();
        return;
      }
      if (hasApple) {
        await reauthenticateWithApple();
        return;
      }
      throw new Error(
        'No supported sign-in provider found for reauthentication'
      );
    }

    if (!user?.email) {
      throw new Error('User email is required for reauthentication');
    }
    const cred = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user as User, cred);
  };

  const updatePassword = async (targetUser: User, newPassword: string) => {
    await firebaseUpdatePassword(targetUser, newPassword);
  };

  return { hasGoogle, hasApple, hasPassword, reauth, updatePassword };
}
