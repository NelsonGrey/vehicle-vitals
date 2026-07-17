import { useEffect, useState } from 'react';
import { remoteConfigFlag, remoteConfigReady } from './firebaseConfig';

/**
 * Runtime "app offline" kill switch, driven by Remote Config's app_offline
 * parameter so it can be flipped from the Firebase Console without a
 * rebuild+redeploy — for a pre-launch window or a maintenance outage.
 * Starts `true` (safe default) until the fetch-and-activate call resolves,
 * then reflects the real value. Starting from the SDK's synchronous cached
 * value instead would let a sign-in/sign-up/purchase form render — and
 * become interactive — for the brief window before the fetch resolves, even
 * when the console value is `true`.
 */
export function useAppOffline(): boolean {
  const [isOffline, setIsOffline] = useState(true);

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
