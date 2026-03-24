import AdBanner from './AdBanner';
import { getAdSlot } from '../shared/adPlacements';

export default function HeaderAdBar() {
  return (
    <div className="shrink-0 border-b border-slate-200 bg-white/95 dark:border-slate-700 dark:bg-slate-900/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-5 py-2">
        <AdBanner className="my-0" slot={getAdSlot('header')} />
      </div>
    </div>
  );
}
