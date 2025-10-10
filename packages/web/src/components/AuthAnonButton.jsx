import React, { useEffect, useState } from 'react';

// Create async Firebase service that hides imports from Vite
const createFirebaseAuth = async () => {
  try {
    // Use Function constructor to hide imports from Vite's static analysis
    const authFn = new Function('return import("firebase/auth")');
    const configFn = new Function('return import("../shared/firebaseConfig")');
    
    const [{ onAuthStateChanged, signInAnonymously }, { getFirebaseAuth }] = await Promise.all([
      authFn(),
      configFn()
    ]);

    const auth = await getFirebaseAuth();
    return { auth, onAuthStateChanged, signInAnonymously };
  } catch (error) {
    console.warn('Firebase auth not available:', error);
    // Return mock service for build compatibility
    return {
      auth: { currentUser: null },
      onAuthStateChanged: () => () => {},
      signInAnonymously: async () => {}
    };
  }
};

export default function AuthAnonButton() {
  const [authed, setAuthed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [firebaseAuth, setFirebaseAuth] = useState(null);

  useEffect(() => {
    createFirebaseAuth().then(service => {
      setFirebaseAuth(service);
      setAuthed(!!service.auth.currentUser);
      
      const unsub = service.onAuthStateChanged(service.auth, (user) => setAuthed(!!user));
      return () => unsub();
    });
  }, []);

  if (authed || !firebaseAuth) return null;

  const signIn = async () => {
    if (!firebaseAuth) return;
    
    setBusy(true);
    setError('');
    try {
      await firebaseAuth.signInAnonymously(firebaseAuth.auth);
    } catch (e) {
      setError(e?.message || 'Failed to sign in');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      background: '#fff7e6',
      border: '1px solid #ffcc80',
      padding: 10,
      margin: '10px 20px',
      borderRadius: 6,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      justifyContent: 'space-between'
    }}>
      <span style={{ fontSize: 14 }}>You’re not signed in.</span>
      <div>
        <button onClick={signIn} disabled={busy} style={{ padding: '6px 10px' }}>
          {busy ? 'Signing in…' : 'Continue without account'}
        </button>
        {error && <span style={{ color: '#d00', marginLeft: 8, fontSize: 12 }}>{error}</span>}
      </div>
    </div>
  );
}
