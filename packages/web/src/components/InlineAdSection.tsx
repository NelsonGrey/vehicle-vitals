import type { WebAdPlacement } from '../shared/adPlacements';
import AdPlacement from './AdPlacement';

interface InlineAdSectionProps {
  placement?: WebAdPlacement;
  className?: string;
}

export default function InlineAdSection({
  placement = 'maintenanceHistory',
  className,
}: InlineAdSectionProps) {
  return (
    <section
      aria-label="Sponsored content"
      className={`rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800 ${className || ''}`}
    >
      <AdPlacement placement={placement} className="my-0" />
    </section>
  );
}
