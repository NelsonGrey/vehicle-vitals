import type { CSSProperties } from 'react';

interface StackedVLogoProps {
  size?: number;
  color?: string;
  accent?: string;
  showText?: boolean;
  compact?: boolean;
  wordmarkColor?: string;
  windowColor?: string;
  gaugeColor?: string;
}

export default function StackedVLogo({
  size = 32,
  color = 'currentColor',
  showText = true,
  compact = false,
  wordmarkColor = '#64748b',
}: StackedVLogoProps) {
  const width = size;
  const isLightMark =
    color.toLowerCase() === '#ffffff' ||
    color.toLowerCase() === 'white' ||
    wordmarkColor.toLowerCase() === '#ffffff';
  const logoSrc = isLightMark
    ? '/assets/vehicle-vitals-header-mark-light.png'
    : '/assets/vehicle-vitals-header-mark.png';

  const compactFontSize = Math.max(14, Math.round(size * 0.3));
  const compactLetterSpacing = +(compactFontSize * -0.025).toFixed(2);

  const wordmark = (
    <div
      className={`stacked-v-logo-wordmark ${compact ? 'compact' : ''} ${wordmarkColor === '#64748b' ? '' : 'shadow'}`}
      style={{ color: wordmarkColor }}
    >
      {compact ? 'Vehicle Vitals' : <>VEHICLE<br />VITALS</>}
    </div>
  );

  return (
    <div
      className={`stacked-v-logo-container ${compact ? 'compact' : ''}`}
      style={
        compact
          ? ({
              '--logo-icon-size': `${size}px`,
              '--logo-font-size': `${compactFontSize}px`,
              '--logo-letter-spacing': `${compactLetterSpacing}px`,
            } as CSSProperties)
          : undefined
      }
    >
      <img
        src={logoSrc}
        width={width}
        height={size}
        className="stacked-v-logo-mark"
        alt=""
        aria-hidden="true"
        decoding="async"
      />
      {showText && wordmark}
    </div>
  );
}
