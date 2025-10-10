import React, { useEffect, useState } from 'react';
import { getVehicles } from '../shared/firestoreService';

const shouldShow = () => import.meta.env.DEV || import.meta.env.VITE_SHOW_STATUS === 'true';

// Create async Firebase auth service that hides imports from Vite
const createFirebaseAuthService = async () => {
  try {
    // Use Function constructor to hide imports from Vite's static analysis
    const authFn = new Function('return import("firebase/auth")');
    const configFn = new Function('return import("../shared/firebaseConfig")');
    
    const [{ onAuthStateChanged }, { getFirebaseAuth }] = await Promise.all([
      authFn(),
      configFn()
    ]);

    const auth = await getFirebaseAuth();
    return { auth, onAuthStateChanged };
  } catch (error) {
    console.warn('Firebase auth not available:', error);
    // Return mock service for build compatibility
    return {
      auth: { currentUser: null },
      onAuthStateChanged: () => () => {}
    };
  }
};

export default function DevStatusPanel() {
  const [visible] = useState(shouldShow());
  const [uid, setUid] = useState('');
  const [count, setCount] = useState(0);
  const [authService, setAuthService] = useState(null);

  useEffect(() => {
    if (!visible) return;
    
    createFirebaseAuthService().then(service => {
      setAuthService(service);
      setUid(service.auth.currentUser?.uid || '');
      
      const unsub = service.onAuthStateChanged(service.auth, async (user) => {
        setUid(user?.uid || '');
        if (!user?.uid) {
          setCount(0);
          return;
        }
        try {
          const list = await getVehicles();
          setCount(list.length);
        } catch {
          setCount(0);
        }
      });
      return () => unsub();
    });
  }, [visible]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      background: '#eef6ff',
      borderBottom: '1px solid #cfe3ff',
      padding: '6px 12px',
      fontSize: 12,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <span>UID: {uid || '(signed out)'}</span>
      <span>Vehicles: {count}</span>
    </div>
  );
}
