/**
 * WheelBreakdownChart — a dependency-free SVG donut styled like a wheel
 * (tread-segment dividers, hub center) for category breakdowns, e.g. cost by
 * service type. Replaces plain CSS bar breakdowns to carry the app's
 * car-racing visual theme.
 */

export interface WheelBreakdownSegment {
  label: string;
  amount: number;
  color: string;
}

interface WheelBreakdownChartProps {
  segments: WheelBreakdownSegment[];
  formatAmount: (amount: number) => string;
  size?: number;
  centerLabel?: string;
  centerValue?: string;
}

const BOX = 160;
const RADIUS = 62;
const STROKE = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function WheelBreakdownChart({
  segments,
  formatAmount,
  size = BOX,
  centerLabel,
  centerValue,
}: WheelBreakdownChartProps) {
  const total = segments.reduce((sum, s) => sum + s.amount, 0);
  const cx = BOX / 2;
  const cy = BOX / 2;

  let cursor = 0;
  const arcs = segments.map(segment => {
    const fraction = total > 0 ? segment.amount / total : 0;
    const dash = fraction * CIRCUMFERENCE;
    const gap = CIRCUMFERENCE - dash;
    const rotation = (cursor / total) * 360 - 90;
    cursor += segment.amount;
    return { ...segment, dash, gap, rotation, fraction };
  });

  const treadTicks = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * 360;
    const rad = (angle * Math.PI) / 180;
    const outerR = RADIUS + STROKE / 2 + 3;
    const innerR = RADIUS + STROKE / 2 - 1;
    return {
      key: i,
      x1: cx + innerR * Math.cos(rad),
      y1: cy + innerR * Math.sin(rad),
      x2: cx + outerR * Math.cos(rad),
      y2: cy + outerR * Math.sin(rad),
    };
  });

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${BOX} ${BOX}`} className="shrink-0">
        {/* tire tread dividers */}
        {treadTicks.map(tick => (
          <line
            key={tick.key}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke="currentColor"
            strokeWidth={1}
            className="text-slate-300 dark:text-slate-600"
          />
        ))}
        {/* track */}
        <circle
          cx={cx}
          cy={cy}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          className="text-slate-100 dark:text-slate-700"
        />
        {arcs.map(arc => (
          <circle
            key={arc.label}
            cx={cx}
            cy={cy}
            r={RADIUS}
            fill="none"
            stroke={arc.color}
            strokeWidth={STROKE}
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            transform={`rotate(${arc.rotation} ${cx} ${cy})`}
            strokeLinecap="butt"
          />
        ))}
        {/* hub */}
        <circle
          cx={cx}
          cy={cy}
          r={RADIUS - STROKE / 2 - 4}
          className="fill-white dark:fill-slate-800"
          stroke="currentColor"
          strokeWidth={1}
          strokeOpacity={0.15}
        />
        {centerValue && (
          <text
            x={cx}
            y={cy - (centerLabel ? 4 : -4)}
            textAnchor="middle"
            fontSize={18}
            fontWeight={700}
            className="fill-slate-900 dark:fill-slate-100"
          >
            {centerValue}
          </text>
        )}
        {centerLabel && (
          <text
            x={cx}
            y={cy + 14}
            textAnchor="middle"
            fontSize={9}
            className="fill-slate-500 dark:fill-slate-400"
          >
            {centerLabel}
          </text>
        )}
      </svg>

      <div className="w-full space-y-1.5">
        {arcs.map(arc => (
          <div key={arc.label} className="flex items-center gap-2 text-xs">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{
                backgroundColor: arc.color,
                backgroundImage:
                  'linear-gradient(45deg, rgba(255,255,255,0.35) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.35) 75%, transparent 75%, transparent)',
                backgroundSize: '4px 4px',
              }}
            />
            <span className="flex-1 truncate text-slate-600 dark:text-slate-400">
              {arc.label}
            </span>
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {formatAmount(arc.amount)}
            </span>
            <span className="w-9 text-right text-[10px] text-slate-400 dark:text-slate-500">
              {Math.round(arc.fraction * 100)}%
            </span>
          </div>
        ))}
        {arcs.length === 0 && (
          <p className="m-0 text-xs text-slate-400 dark:text-slate-500">No spend recorded yet.</p>
        )}
      </div>
    </div>
  );
}
