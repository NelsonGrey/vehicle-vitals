import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

// Production-safe auth context that loads Firebase dynamically
let firebaseAuth = null;
let firebaseConfig = null;

// Initialize Firebase auth asynchronously
const initializeFirebase = async () => {
  if (typeof window === 'undefined') return null;
  
  try {
    // Use Function constructor to completely hide imports from Vite
    const importFn = new Function('specifier', 'return import(specifier)');
    
    const [configModule, authModule] = await Promise.all([
      importFn('./firebaseConfig'),
      importFn('firebase' + '/auth')
    ]);
    
    firebaseConfig = configModule;
    firebaseAuth = authModule;
    
    const auth = await configModule.getFirebaseAuth();
    return { auth, authFunctions: authModule };
  } catch (error) {
    console.warn('Firebase not available:', error.message);
    return null;
  }
};

const AuthContext = createContext({
  user: null,
  loading: true,
  signIn: async () => { throw new Error('Firebase not initialized'); },
  signUp: async () => { throw new Error('Firebase not initialized'); },
  signOut: async () => { throw new Error('Firebase not initialized'); },
  signInWithGoogle: async () => { throw new Error('Firebase not initialized'); },
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firebase, setFirebase] = useState(null);

  useEffect(() => {
    // Initialize Firebase asynchronously
    initializeFirebase().then((firebaseServices) => {
      if (firebaseServices) {
        const { auth, authFunctions } = firebaseServices;
        setFirebase({ auth, authFunctions });
        
        // Set up auth state listener
        const unsub = authFunctions.onAuthStateChanged(auth, (u) => {
          setUser(u || null);
          setLoading(false);
        });
        
        return () => unsub();
      } else {
        // No Firebase available
        setLoading(false);
      }
    });
  }, []);

  const value = useMemo(() => {
    if (!firebase) {
      return {
        user: null,
        loading,
        signIn: async () => { throw new Error('Firebase not available'); },
        signUp: async () => { throw new Error('Firebase not available'); },
        signOut: async () => { throw new Error('Firebase not available'); },
        signInWithGoogle: async () => { throw new Error('Firebase not available'); },
      };
    }

    const { auth, authFunctions } = firebase;
    const googleProvider = new authFunctions.GoogleAuthProvider();

    return {
      user,
      loading,
      signIn: (email, password) => authFunctions.signInWithEmailAndPassword(auth, email, password),
      signUp: (email, password) => authFunctions.createUserWithEmailAndPassword(auth, email, password),
      signOut: () => authFunctions.signOut(auth),
      signInWithGoogle: () => authFunctions.signInWithPopup(auth, googleProvider),
    };
  }, [user, loading, firebase]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
