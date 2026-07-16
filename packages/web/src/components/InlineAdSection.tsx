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
    <AdPlacement
      placement={placement}
      className={`my-0 ${className || ''}`}
      hideLabel
      surface="flat"
    />
  );
}
