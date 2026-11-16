import { useEffect, useState } from 'react';
import { remoteConfigFlag, remoteConfigReady } from './firebaseRemoteConfig';

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
  // Browser sessions start offline until Remote Config resolves so a console
  // kill switch cannot flash an enabled signup form. The prerender runs with
  // the published default (app_offline false) so the HTML ships the real
  // calls to action instead of "Currently unavailable".
  const [isOffline, setIsOffline] = useState(() => !import.meta.env.SSR);

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
