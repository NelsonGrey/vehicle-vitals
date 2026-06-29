import {
  AuthCredential,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  linkWithCredential,
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
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  consolidateAccountData,
  ConsolidationResult,
} from '../utils/accountConsolidationService';
import { getSupportAccessContext } from '../utils/supportAdminService';
import { auth } from './firebaseConfig';

export interface SupportAccessContext {
  isSuperAdmin: boolean;
  accessReason: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  supportAccess: SupportAccessContext | null;
  supportAccessLoading: boolean;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<UserCredential>;
  signInWithApple: () => Promise<UserCredential>;
  linkWithGoogle: () => Promise<UserCredential>;
  linkWithApple: () => Promise<UserCredential>;
  resetPassword: (email: string) => Promise<void>;
  consolidateAccountData: (
    sourceUid: string,
    idempotencyKey?: string
  ) => Promise<ConsolidationResult>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  supportAccess: null,
  supportAccessLoading: true,
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
  consolidateAccountData: async () => {
    throw new Error('Firebase not initialized');
  },
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pendingLinkCredentialRef = useRef<AuthCredential | null>(null);
  const pendingLinkEmailRef = useRef<string>('');
  const [supportAccess, setSupportAccess] =
    useState<SupportAccessContext | null>(null);
  const [supportAccessLoading, setSupportAccessLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadSupportAccess = async () => {
      if (!user) {
        setSupportAccess(null);
        setSupportAccessLoading(false);
        return;
      }

      setSupportAccessLoading(true);

      try {
        const access = await getSupportAccessContext();

        if (!isActive) {
          return;
        }

        setSupportAccess(access);
      } catch {
        if (!isActive) {
          return;
        }

        setSupportAccess({
          isSuperAdmin: false,
          accessReason: 'Support access unavailable',
        });
      } finally {
        if (isActive) {
          setSupportAccessLoading(false);
        }
      }
    };

    void loadSupportAccess();

    return () => {
      isActive = false;
    };
  }, [user]);

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

    const linkPendingProviderIfNeeded = async (signedInUser: User | null) => {
      const pendingCredential = pendingLinkCredentialRef.current;
      if (!pendingCredential || !signedInUser) {
        return;
      }

      const pendingEmail = pendingLinkEmailRef.current.trim().toLowerCase();
      const signedInEmail = (signedInUser.email || '').trim().toLowerCase();
      if (pendingEmail && signedInEmail && pendingEmail !== signedInEmail) {
        return;
      }

      try {
        await linkWithCredential(signedInUser, pendingCredential);
      } catch (error) {
        const firebaseError = error as { code?: string };
        if (
          firebaseError.code !== 'auth/provider-already-linked' &&
          firebaseError.code !== 'auth/credential-already-in-use' &&
          firebaseError.code !== 'auth/requires-recent-login'
        ) {
          throw error;
        }
      } finally {
        pendingLinkCredentialRef.current = null;
        pendingLinkEmailRef.current = '';
      }
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
          const credential =
            GoogleAuthProvider.credentialFromError(error) ||
            OAuthProvider.credentialFromError(error);
          if (credential) {
            pendingLinkCredentialRef.current = credential;
            pendingLinkEmailRef.current = (
              firebaseError.customData?.email || ''
            )
              .trim()
              .toLowerCase();
          }
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
      supportAccess,
      supportAccessLoading,
      signIn: async (email: string, password: string) => {
        const credential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        await linkPendingProviderIfNeeded(credential.user);
        return credential;
      },
      signUp: (email: string, password: string) =>
        createUserWithEmailAndPassword(auth, email, password),
      signOut: async () => {
        pendingLinkCredentialRef.current = null;
        pendingLinkEmailRef.current = '';
        await signOut(auth);
      },
      signInWithGoogle: () => signInWithProvider(googleProvider),
      signInWithApple: () => signInWithProvider(appleProvider),
      linkWithGoogle: () => linkCurrentUserWithProvider(googleProvider),
      linkWithApple: () => linkCurrentUserWithProvider(appleProvider),
      resetPassword: (email: string) => sendPasswordResetEmail(auth, email),
      consolidateAccountData: (sourceUid: string, idempotencyKey?: string) =>
        consolidateAccountData({ sourceUid, idempotencyKey }),
    };
  }, [user, loading, supportAccess, supportAccessLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
