interface HexProps {
  cx: number;
  cy: number;
  r?: number;
  fill?: string;
  stroke?: string;
}

function Hex({ cx, cy, r = 3, fill = 'currentColor', stroke = 'none' }: HexProps) {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + Math.PI / 6; // flat-top hex
    points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return <polygon points={points.join(' ')} fill={fill} stroke={stroke} />;
}

interface StackedVLogoProps {
  size?: number;
  color?: string;
  accent?: string;
  showText?: boolean;
  compact?: boolean;
  wordmarkColor?: string;
}

export default function StackedVLogo({
  size = 32,
  color = 'currentColor',
  accent = '#334155',
  showText = true,
  compact = false,
  wordmarkColor = '#64748b'
}: StackedVLogoProps) {
  const width = Math.round(size * 2.1);
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
        viewBox="0 0 72 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
  {/* Outer V (further inset to avoid edge collision and add breathing room) */}
  <path d="M12 4 L32 30 L52 4" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
  {/* Middle V — more inset to increase spacing */}
  <path d="M14 5 L32 26 L50 5" stroke={color} strokeOpacity="0.75" strokeWidth="2.1" strokeLinecap="round" />
  {/* Inner V — further inset and higher clearance for stronger separation */}
  <path d="M24 8 L32 20 L40 8" stroke={accent} strokeWidth="3.0" strokeLinecap="round" />

        {/* Bolt accents (hex nuts) at endpoints and apex */}
  <Hex cx={12} cy={4} r={3.5} fill={color} />
  <Hex cx={52} cy={4} r={3.5} fill={color} />
        <Hex cx={32} cy={30} r={3.5} fill={accent} />
      </svg>
      {showText && wordmark}
    </div>
  );
}
