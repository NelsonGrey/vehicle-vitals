import { useEffect, useState } from 'react';

// Create async Firebase service that hides imports from Vite
const createFirebaseAuth = async () => {
  try {
    const [{ onAuthStateChanged, signInAnonymously }, { getFirebaseAuth }] =
      await Promise.all([
        import('firebase/auth'),
        import('../shared/firebaseConfig'),
      ]);

    const auth = await getFirebaseAuth();
    return { auth, onAuthStateChanged, signInAnonymously };
  } catch (error) {
    console.warn('Firebase auth not available:', error);
    // Return mock service for build compatibility
    return {
      auth: { currentUser: null },
      onAuthStateChanged: () => () => {},
      signInAnonymously: async () => {},
    };
  }
};

export default function AuthAnonButton() {
  const [authed, setAuthed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [firebaseAuth, setFirebaseAuth] = useState<{
    auth: { currentUser?: unknown };
    onAuthStateChanged: (
      auth: unknown,
      callback: (user: unknown) => void
    ) => () => void;
    signInAnonymously: (auth: unknown) => Promise<void>;
  } | null>(null);

  useEffect(() => {
    createFirebaseAuth().then(service => {
      setFirebaseAuth(service);
      setAuthed(!!service.auth.currentUser);

      const unsub = service.onAuthStateChanged(service.auth, (user: unknown) =>
        setAuthed(!!user)
      );
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
    } catch (e: unknown) {
      const error = e as Error;
      setError(error?.message || 'Failed to sign in');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-anon-banner">
      <span className="auth-anon-text">You&apos;re not signed in.</span>
      <div>
        <button onClick={signIn} disabled={busy} className="auth-anon-button">
          {busy ? 'Signing in…' : 'Continue without account'}
        </button>
        {error && <span className="auth-anon-error">{error}</span>}
      </div>
    </div>
  );
}
