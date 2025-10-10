import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdBanner from '../components/AdBanner';
import { useAuth } from '../shared/AuthContext';

export default function SignUp() {
  const { signUp, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signUp(email, password);
      navigate('/app', { replace: true });
    } catch (err) {
      const msg = String(err?.message || 'Failed to create account');
      const hint = msg.includes('api-key-not-valid') ? ' (Check VITE_FIREBASE_* env vars; see web/.env.example)' : '';
      setError(msg + hint);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-5 py-5">
      <AdBanner />
      <h1 className="font-serif font-bold text-4xl text-charcoal-800 dark:text-cream-100 mb-4">Sign Up</h1>
      <p className="text-charcoal-600 dark:text-cream-300 mb-6">Create your Vehicle Vitals account to start tracking maintenance and logs.</p>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4" role="alert">{error}</div>}
      <form onSubmit={onSubmit} className="bg-white dark:bg-charcoal-800 rounded-lg shadow-md p-6">
        <div className="mb-6">
          <label htmlFor="email" className="block text-sm font-medium text-charcoal-700 dark:text-cream-200 mb-2">Email address</label>
          <input 
            id="email" 
            type="email" 
            className="w-full px-3 py-2 border border-charcoal-300 dark:border-charcoal-600 rounded-md focus:outline-none focus:ring-2 focus:ring-oxblood-500 focus:border-oxblood-500 dark:bg-charcoal-700 dark:text-cream-100" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium text-charcoal-700 dark:text-cream-200 mb-2">Password</label>
          <input 
            id="password" 
            type="password" 
            className="w-full px-3 py-2 border border-charcoal-300 dark:border-charcoal-600 rounded-md focus:outline-none focus:ring-2 focus:ring-oxblood-500 focus:border-oxblood-500 dark:bg-charcoal-700 dark:text-cream-100" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button 
            type="submit" 
            className="flex-1 bg-oxblood-600 hover:bg-oxblood-700 disabled:bg-charcoal-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200" 
            disabled={busy}
          >
            {busy ? 'Creating account…' : 'Create Account'}
          </button>
          <button 
            type="button" 
            className="flex-1 border border-charcoal-300 dark:border-charcoal-600 hover:bg-charcoal-50 dark:hover:bg-charcoal-700 disabled:bg-charcoal-100 text-charcoal-700 dark:text-cream-200 font-medium py-2 px-4 rounded-md transition-colors duration-200" 
            disabled={busy} 
            onClick={async () => {
              setBusy(true);
              setError('');
              try {
                await signInWithGoogle();
                navigate('/app', { replace: true });
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
      <p className="mt-6 text-center text-charcoal-600 dark:text-cream-300">
        Already have an account? <Link to="/login" className="text-oxblood-600 hover:text-oxblood-700 font-medium">Sign in</Link>
      </p>
    </div>
  );
}
