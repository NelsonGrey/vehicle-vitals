import { useEffect, useState } from 'react';

interface AuthService {
  EmailAuthProvider: {
    credential: (email: string, password: string) => unknown;
  };
  reauthenticateWithCredential: (
    user: unknown,
    credential: unknown
  ) => Promise<void>;
  updatePassword: (user: unknown, newPassword: string) => Promise<void>;
}

declare global {
  interface Window {
    firebase: {
      app: any;
      auth: any;
      firestore: any;
      functions: any;
      messaging: any;
      storage: any;
    };
  }
}

const createFirebaseAuthService = async (): Promise<AuthService> => {
  try {
    const checkFirebase = () => {
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max

        const check = () => {
          attempts++;
          if (window.firebase && window.firebase.auth) {
            resolve(window.firebase);
          } else if (attempts >= maxAttempts) {
            reject(new Error('Firebase SDKs failed to load within timeout'));
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      });
    };

    const firebase = (await checkFirebase()) as typeof window.firebase;
    return {
      EmailAuthProvider: firebase.auth.EmailAuthProvider,
      reauthenticateWithCredential: firebase.auth.reauthenticateWithCredential,
      updatePassword: firebase.auth.updatePassword,
    };
  } catch (error) {
    console.warn('Firebase auth not available:', error);
    return {
      EmailAuthProvider: { credential: () => ({}) },
      reauthenticateWithCredential: async () => {},
      updatePassword: async () => {},
    };
  }
};

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
 */
export function useReauthentication({
  user,
  reauthenticateWithGoogle,
  reauthenticateWithApple,
}: UseReauthenticationArgs) {
  const [authService, setAuthService] = useState<AuthService | null>(null);

  useEffect(() => {
    createFirebaseAuthService().then(setAuthService);
  }, []);

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
    if (!authService) {
      throw new Error('Authentication service is still loading');
    }
    const cred = authService.EmailAuthProvider.credential(
      user.email,
      currentPassword
    );
    await authService.reauthenticateWithCredential(user, cred);
  };

  return { authService, hasGoogle, hasApple, hasPassword, reauth };
}
