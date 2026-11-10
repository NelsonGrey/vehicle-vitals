import { useEffect, useState } from 'react';
import { scheduleIdle } from '../shared/scheduleIdle';

export default function HeaderAdBar() {
  // Starts false (no reserved space) and only grows to fit once
  // AdPlacement confirms it's actually showing something -- avoids a
  // padded/empty bar flashing in for every unfilled or blocked ad.
  const [visible, setVisible] = useState(false);
  const [AdPlacement, setAdPlacement] = useState<
    typeof import('./AdPlacement').default | null
  >(null);

  // Ads pull Firestore and the monetization client. Load them after first
  // paint so the marketing hero is not waiting on that code.
  useEffect(() => {
    let cancelled = false;
    const cancelIdle = scheduleIdle(() => {
      void import('./AdPlacement').then(mod => {
        if (!cancelled) setAdPlacement(() => mod.default);
      });
    });
    return () => {
      cancelled = true;
      cancelIdle();
    };
  }, []);

  return (
    <div
      className={
        visible ? 'shrink-0 bg-slate-50 dark:bg-slate-900' : 'hidden'
      }
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-5 py-2">
        {AdPlacement ? (
          <AdPlacement
            placement="header"
            className="my-0"
            hideLabel
            surface="flat"
            onVisibilityChange={setVisible}
          />
        ) : null}
      </div>
    </div>
  );
}
