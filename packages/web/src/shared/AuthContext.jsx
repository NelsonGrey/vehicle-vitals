import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { firebaseConfig } from './firebaseConfig';

// Production-safe auth context that uses globally loaded Firebase SDKs
let firebaseAuth = null;

// Initialize Firebase auth by checking for global Firebase objects
const initializeFirebase = async () => {
  if (typeof window === 'undefined') return null;

  // Wait for Firebase to be available globally
  const checkFirebase = () => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max

      const check = () => {
        attempts++;
        if (window.firebase && window.firebase.auth && window.firebase.app) {
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

  try {
    const firebase = await checkFirebase();

    // Import config module for the config object
    // const { firebaseConfig } = await import('./firebaseConfig');

    // Initialize Firebase app if not already initialized
    let app;
    try {
      app = firebase.app.getApp();
    } catch {
      app = firebase.app.initializeApp(firebaseConfig);
    }

    const auth = firebase.auth.getAuth(app);

    return { auth, authFunctions: firebase.auth };
  } catch (error) {
    console.warn('Firebase not available:', error.message);
    return null;
  }
};const AuthContext = createContext({
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
