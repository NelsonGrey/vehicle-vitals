import type { WebAdPlacement } from '../shared/adPlacements';
import AdPlacement from './AdPlacement';

interface InlineAdSectionProps {
  placement?: WebAdPlacement;
  className?: string;
  onVisibilityChange?: (visible: boolean) => void;
}

export default function InlineAdSection({
  placement = 'maintenanceHistory',
  className,
  onVisibilityChange,
}: InlineAdSectionProps) {
  return (
    <AdPlacement
      placement={placement}
      className={`my-0 ${className || ''}`}
      hideLabel
      surface="flat"
      onVisibilityChange={onVisibilityChange}
    />
  );
}
