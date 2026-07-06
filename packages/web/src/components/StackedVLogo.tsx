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
  accent = '#334155',
  showText = true,
  compact = false,
  wordmarkColor = '#64748b',
  windowColor = '#cbd5e1',
  gaugeColor = '#dc2626'
}: StackedVLogoProps) {
  const width = Math.round(size * 2.34);
  const height = size;

  const wordmark = (
    <div className={`stacked-v-logo-wordmark ${compact ? 'compact' : ''} ${wordmarkColor === '#64748b' ? '' : 'shadow'}`} style={{ color: wordmarkColor }}>
      VEHICLE<br />VITALS
    </div>
  );

  return (
    <div className={`stacked-v-logo-container ${compact ? 'compact' : ''}`}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 75 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        {/* Flat, bold hot-rod silhouette — a small-size-legible stand-in for
            the detailed app icon photo: low body, rounded cockpit bubble,
            long hood, big wheels. */}
        <path
          d="M 6,24 Q 6,17 13,16 Q 16,10 24,10 Q 30,10 33,14 Q 40,16 46,16 Q 50,16 50,20 L 50,24 Z"
          fill={color}
        />
        <path d="M 19,16 Q 19,13.2 22,12.8 Q 26,13 27.5,15.5 Z" fill={windowColor} />
        <circle cx="16" cy="25" r="5" fill={accent} />
        <circle cx="42" cy="25" r="5" fill={accent} />

        {/* Temperature gauge beside the car — ties "Vehicle" to "Vitals"
            (a vital sign reading). Kept as a separate, larger element
            rather than embedded in the car so its shape (bulb, tube,
            rising fill) stays legible small. */}
        <rect x="61.7" y="6" width="4.6" height="19" rx="2.3" stroke={gaugeColor} strokeWidth="1.8" fill="none" />
        <rect x="62.9" y="10" width="2.2" height="15" rx="1.1" fill={gaugeColor} />
        <circle cx="64" cy="27" r="4.5" fill={gaugeColor} />
      </svg>
      {showText && wordmark}
    </div>
  );
}
