/**
 * GaugeDial — a dependency-free SVG speedometer-style gauge for a single
 * 0-100 value. Used anywhere the app previously showed a plain progress bar
 * or a bare percentage/score, to carry the app's motorsport visual theme.
 */

const SIZE_CONFIG = {
  sm: { box: 96, stroke: 8, font: 16 },
  md: { box: 140, stroke: 10, font: 22 },
  lg: { box: 180, stroke: 12, font: 28 },
} as const;

type GaugeSize = keyof typeof SIZE_CONFIG;

interface GaugeDialProps {
  /** 0-100 */
  value: number;
  label?: string;
  sublabel?: string;
  size?: GaugeSize;
  /** Format the center readout; defaults to "<value>%" */
  formatValue?: (value: number) => string;
}

const ARC_START = 180; // degrees, left horizontal
const ARC_END = 0; // right horizontal (sweeps down through 90 at top... actually semicircle over the top)

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy - r * Math.sin(angleRad),
  };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = startAngle - endAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

function zoneColor(value: number) {
  if (value < 40) return '#e11d48'; // rose-600 (danger)
  if (value < 70) return '#f59e0b'; // amber-500 (warning)
  return '#16a34a'; // green-600 (accent)
}

export default function GaugeDial({
  value,
  label,
  sublabel,
  size = 'md',
  formatValue,
}: GaugeDialProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const { box, stroke, font } = SIZE_CONFIG[size];
  const cx = box / 2;
  const cy = box / 2 + box * 0.08;
  const r = box / 2 - stroke - 4;

  const valueAngle = ARC_START - (clamped / 100) * (ARC_START - ARC_END);
  const needleTip = polarToCartesian(cx, cy, r - stroke / 2, valueAngle);
  const trackPath = describeArc(cx, cy, r, ARC_START, ARC_END);
  const valuePath = describeArc(cx, cy, r, ARC_START, valueAngle);
  const color = zoneColor(clamped);

  const ticks = Array.from({ length: 6 }, (_, i) => {
    const angle = ARC_START - (i / 5) * (ARC_START - ARC_END);
    const outer = polarToCartesian(cx, cy, r + stroke / 2 + 2, angle);
    const inner = polarToCartesian(cx, cy, r + stroke / 2 - 2, angle);
    return { key: i, x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y };
  });

  const displayValue = formatValue ? formatValue(clamped) : `${Math.round(clamped)}%`;

  return (
    <div className="inline-flex flex-col items-center" role="img" aria-label={`${label || 'Gauge'}: ${displayValue}`}>
      <svg width={box} height={box * 0.66} viewBox={`0 0 ${box} ${box * 0.66}`}>
        {ticks.map(tick => (
          <line
            key={tick.key}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke="currentColor"
            strokeWidth={1.5}
            className="text-slate-300 dark:text-slate-600"
          />
        ))}
        <path
          d={trackPath}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="text-slate-150 dark:text-slate-700"
          opacity={0.5}
        />
        <path
          d={valuePath}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke="currentColor"
          strokeWidth={2}
          className="text-slate-700 dark:text-slate-200"
        />
        <circle cx={cx} cy={cy} r={4} fill="currentColor" className="text-slate-700 dark:text-slate-200" />
        <text
          x={cx}
          y={cy - font * 0.4}
          textAnchor="middle"
          fontSize={font}
          fontWeight={700}
          className="fill-slate-900 dark:fill-slate-100"
        >
          {displayValue}
        </text>
      </svg>
      {label && (
        <div className="mt-1 text-center">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {label}
          </div>
          {sublabel && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400">{sublabel}</div>
          )}
        </div>
      )}
    </div>
  );
}
