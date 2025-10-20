import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
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

    return {
      user,
      loading,
      signIn: (email: string, password: string) =>
        signInWithEmailAndPassword(auth, email, password),
      signUp: (email: string, password: string) =>
        createUserWithEmailAndPassword(auth, email, password),
      signOut: () => signOut(auth),
      signInWithGoogle: () => signInWithPopup(auth, googleProvider),
      signInWithApple: () => {
        const appleProvider = new OAuthProvider('apple.com');
        appleProvider.addScope('email');
        appleProvider.addScope('name');
        return signInWithPopup(auth, appleProvider);
      },
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
