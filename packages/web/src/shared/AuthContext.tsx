import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  linkWithPopup,
  OAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
  UserCredential,
} from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth } from './firebaseConfig';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<UserCredential>;
  signInWithApple: () => Promise<UserCredential>;
  linkWithGoogle: () => Promise<UserCredential>;
  linkWithApple: () => Promise<UserCredential>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {
    throw new Error('Firebase not initialized');
  },
  signUp: async () => {
    throw new Error('Firebase not initialized');
  },
  signOut: async () => {
    throw new Error('Firebase not initialized');
  },
  signInWithGoogle: async () => {
    throw new Error('Firebase not initialized');
  },
  signInWithApple: async () => {
    throw new Error('Firebase not initialized');
  },
  linkWithGoogle: async () => {
    throw new Error('Firebase not initialized');
  },
  linkWithApple: async () => {
    throw new Error('Firebase not initialized');
  },
  resetPassword: async () => {
    throw new Error('Firebase not initialized');
  },
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo(() => {
    const googleProvider = new GoogleAuthProvider();
    const appleProvider = new OAuthProvider('apple.com');
    appleProvider.addScope('email');
    appleProvider.addScope('name');

    const providerLabel = (providerId: string) => {
      switch (providerId) {
        case 'password':
          return 'email/password';
        case 'google.com':
          return 'Google';
        case 'apple.com':
          return 'Apple';
        default:
          return providerId;
      }
    };

    const buildProviderConflictError = async (email?: string | null) => {
      if (!email) {
        throw new Error(
          'This credential is already tied to another account. Sign in with your existing method, then link providers from Account.'
        );
      }

      const methods = await fetchSignInMethodsForEmail(auth, email);
      const labels = methods.map(providerLabel);
      throw new Error(
        labels.length
          ? `This email already belongs to an existing account using ${labels.join(', ')}. Sign in with that method first, then link the new provider from Account.`
          : 'This credential is already tied to another account. Sign in with your existing method, then link providers from Account.'
      );
    };

    const signInWithProvider = async (
      provider: GoogleAuthProvider | OAuthProvider
    ) => {
      try {
        return await signInWithPopup(auth, provider);
      } catch (error) {
        const firebaseError = error as {
          code?: string;
          customData?: { email?: string };
        };
        if (
          firebaseError.code === 'auth/account-exists-with-different-credential'
        ) {
          await buildProviderConflictError(firebaseError.customData?.email);
        }
        throw error;
      }
    };

    const linkCurrentUserWithProvider = async (
      provider: GoogleAuthProvider | OAuthProvider
    ) => {
      if (!auth.currentUser) {
        throw new Error('Sign in first before linking a provider.');
      }
      return linkWithPopup(auth.currentUser, provider);
    };

    return {
      user,
      loading,
      signIn: (email: string, password: string) =>
        signInWithEmailAndPassword(auth, email, password),
      signUp: (email: string, password: string) =>
        createUserWithEmailAndPassword(auth, email, password),
      signOut: () => signOut(auth),
      signInWithGoogle: () => signInWithProvider(googleProvider),
      signInWithApple: () => signInWithProvider(appleProvider),
      linkWithGoogle: () => linkCurrentUserWithProvider(googleProvider),
      linkWithApple: () => linkCurrentUserWithProvider(appleProvider),
      resetPassword: (email: string) => sendPasswordResetEmail(auth, email),
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
