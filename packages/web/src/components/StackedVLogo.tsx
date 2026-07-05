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
  {/* Crossed wrenches, echoing the app icon's badge mark */}
  {/* Wrench 1: lower-left jaw to upper-right jaw */}
  <line x1="16" y1="28" x2="48" y2="6" stroke={color} strokeWidth="3.2" strokeLinecap="round" />
  <circle cx="16" cy="28" r="3.8" stroke={color} strokeWidth="2.4" fill="none" />
  <circle cx="48" cy="6" r="3.8" stroke={color} strokeWidth="2.4" fill="none" />

  {/* Wrench 2: upper-left jaw to lower-right jaw, in the accent color for contrast */}
  <line x1="16" y1="6" x2="48" y2="28" stroke={accent} strokeWidth="3.2" strokeLinecap="round" />
  <circle cx="16" cy="6" r="3.8" stroke={accent} strokeWidth="2.4" fill="none" />
  <circle cx="48" cy="28" r="3.8" stroke={accent} strokeWidth="2.4" fill="none" />

        {/* Pivot bolt where the wrenches cross */}
        <Hex cx={32} cy={17} r={3.2} fill={accent} />
      </svg>
      {showText && wordmark}
    </div>
  );
}
