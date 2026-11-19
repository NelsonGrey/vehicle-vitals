import { useEffect, useState } from 'react';
import type { WebAdPlacement } from '../shared/adPlacements';
import { scheduleIdle } from '../shared/scheduleIdle';

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
  const [AdPlacement, setAdPlacement] = useState<
    typeof import('./AdPlacement').default | null
  >(null);

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

  if (!AdPlacement) {
    return null;
  }

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
