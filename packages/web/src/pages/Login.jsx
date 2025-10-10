import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AdBanner from '../components/AdBanner';
import { useAuth } from '../shared/AuthContext';
// Header and footer provided by Layout

export default function Login() {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirect = new URLSearchParams(location.search).get('redirect') || '/app';

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signIn(email, password);
      navigate(redirect, { replace: true });
    } catch (err) {
      const msg = String(err?.message || 'Failed to sign in');
      const hint = msg.includes('api-key-not-valid') ? ' (Check VITE_FIREBASE_* env vars; see web/.env.example)' : '';
      setError(msg + hint);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-5 py-5">
      <AdBanner />
      <h1 className="font-serif font-bold text-4xl text-charcoal dark:text-light-cream mb-4">Login</h1>
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-3 rounded-lg mb-4" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={onSubmit} className="bg-parchment dark:bg-dark-card p-4 rounded-xl border border-tan dark:border-dark-border">
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-charcoal dark:text-light-cream mb-2">
            Email address
          </label>
          <input 
            id="email" 
            type="email" 
            className="w-full px-3 py-2 border border-tan dark:border-dark-border rounded-lg bg-cream dark:bg-deep-brown text-charcoal dark:text-light-cream focus:ring-2 focus:ring-oxblood dark:focus:ring-rust focus:border-transparent outline-none" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium text-charcoal dark:text-light-cream mb-2">
            Password
          </label>
          <input 
            id="password" 
            type="password" 
            className="w-full px-3 py-2 border border-tan dark:border-dark-border rounded-lg bg-cream dark:bg-deep-brown text-charcoal dark:text-light-cream focus:ring-2 focus:ring-oxblood dark:focus:ring-rust focus:border-transparent outline-none" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button 
            type="submit" 
            className="px-4 py-2.5 bg-oxblood text-primary-contrast dark:bg-rust dark:text-deep-brown rounded-lg border border-oxblood dark:border-rust hover:opacity-90 transition-opacity font-medium disabled:opacity-50" 
            disabled={busy}
          >
            {busy ? 'Signing in…' : 'Sign In'}
          </button>
          <button 
            type="button" 
            className="px-4 py-2.5 bg-transparent border border-tan dark:border-dark-border text-charcoal dark:text-light-cream rounded-lg hover:bg-tan/10 dark:hover:bg-dark-border/20 transition-colors font-medium disabled:opacity-50" 
            disabled={busy} 
            onClick={async () => {
              setBusy(true);
              setError('');
              try {
                await signInWithGoogle();
                navigate(redirect, { replace: true });
              } catch (err) {
                setError(String(err?.message || 'Google sign-in failed'));
              } finally {
                setBusy(false);
              }
            }}
          >
            Continue with Google
          </button>
        </div>
      </form>
      <p className="mt-4 text-warm-gray dark:text-light-gray">
        Don't have an account? <Link to="/signup" className="text-oxblood dark:text-rust hover:underline">Sign up</Link>
      </p>
    </div>
  );
}
