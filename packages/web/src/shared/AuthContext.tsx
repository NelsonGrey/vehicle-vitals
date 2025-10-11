import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, OAuthProvider } from 'firebase/auth';
import { auth } from './firebaseConfig';

interface AuthContextType {
  user: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  signInWithApple: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => { throw new Error('Firebase not initialized'); },
  signUp: async () => { throw new Error('Firebase not initialized'); },
  signOut: async () => { throw new Error('Firebase not initialized'); },
  signInWithGoogle: async () => { throw new Error('Firebase not initialized'); },
  signInWithApple: async () => { throw new Error('Firebase not initialized'); },
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
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
      signIn: (email: string, password: string) => signInWithEmailAndPassword(auth, email, password),
      signUp: (email: string, password: string) => createUserWithEmailAndPassword(auth, email, password),
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
