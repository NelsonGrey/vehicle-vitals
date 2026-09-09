import { useState } from 'react';
import AdPlacement from './AdPlacement';

export default function HeaderAdBar() {
  // Starts false (no reserved space) and only grows to fit once
  // AdPlacement confirms it's actually showing something -- avoids a
  // padded/empty bar flashing in for every unfilled or blocked ad.
  const [visible, setVisible] = useState(false);

  return (
    <div
      className={
        visible ? 'shrink-0 bg-slate-50 dark:bg-slate-900' : 'hidden'
      }
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-5 py-2">
        <AdPlacement
          placement="header"
          className="my-0"
          hideLabel
          surface="flat"
          onVisibilityChange={setVisible}
        />
      </div>
    </div>
  );
}
