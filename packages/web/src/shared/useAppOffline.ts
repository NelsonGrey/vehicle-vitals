import { useEffect, useState } from 'react';
import { remoteConfigFlag, remoteConfigReady } from './firebaseConfig';

/**
 * Runtime "app offline" kill switch, driven by Remote Config's app_offline
 * parameter so it can be flipped from the Firebase Console without a
 * rebuild+redeploy — for a pre-launch window or a maintenance outage.
 * Reads the default synchronously (false) and re-checks once the
 * fetch-and-activate call resolves, so a value set in the console is
 * reflected on the next page load without waiting on component-local state.
 */
export function useAppOffline(): boolean {
  const [isOffline, setIsOffline] = useState(() =>
    remoteConfigFlag.bool('app_offline')
  );

  useEffect(() => {
    let cancelled = false;
    remoteConfigReady.then(() => {
      if (!cancelled) {
        setIsOffline(remoteConfigFlag.bool('app_offline'));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return isOffline;
}
