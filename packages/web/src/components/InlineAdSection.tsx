import AdBanner from './AdBanner';
import { getAdSlot, WebAdPlacement } from '../shared/adPlacements';

interface InlineAdSectionProps {
  placement?: WebAdPlacement;
  className?: string;
  label?: string;
}

export default function InlineAdSection({
  placement = 'inlineContent',
  className,
  label = 'Sponsored',
}: InlineAdSectionProps) {
  return (
    <section
      aria-label="Sponsored content"
      className={`rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800 ${className || ''}`}
    >
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <AdBanner className="my-0" slot={getAdSlot(placement)} />
    </section>
  );
}
