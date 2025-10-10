// Dev-only auth bootstrap: signs in anonymously so local writes work.
// Requires Anonymous Sign-in enabled in Firebase Auth for your project.
// This runs only in Vite dev builds.

// Only run in development mode and only if Firebase is available
if (import.meta?.env?.DEV && typeof window !== 'undefined') {
  // Use setTimeout to defer execution and avoid build-time resolution
  setTimeout(async () => {
    try {
      // Use Function constructor to completely hide imports from Vite static analysis
      const importFn = new Function('specifier', 'return import(specifier)');
      
      const firebaseConfigModule = await importFn('./firebaseConfig');
      const firebaseAuthModule = await importFn('firebase' + '/auth');
      
      const { auth } = firebaseConfigModule;
      const { signInAnonymously, onAuthStateChanged } = firebaseAuthModule;
      
      onAuthStateChanged(auth, (user) => {
        if (!user) {
          // Attempt anonymous sign-in; ignore errors in case provider is disabled
          signInAnonymously(auth).catch(() => {});
        }
      });
    } catch (error) {
      // Silently ignore if Firebase is not available
      console.debug('Firebase dev auth not available:', error.message);
    }
  }, 100);
}
