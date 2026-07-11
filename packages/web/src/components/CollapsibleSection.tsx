import { useState } from 'react';
import type { ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: string;
  description?: string;
  headerRight?: ReactNode;
  defaultCollapsed?: boolean;
  /** Controlled mode: when provided (with onToggle), overrides internal state. */
  collapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
  children: ReactNode;
}

export default function CollapsibleSection({
  title,
  description,
  headerRight,
  defaultCollapsed = false,
  collapsed: collapsedProp,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
  const collapsed = collapsedProp ?? internalCollapsed;
  const setCollapsed = (updater: (current: boolean) => boolean) => {
    const next = updater(collapsed);
    if (onToggle) {
      onToggle(next);
    } else {
      setInternalCollapsed(next);
    }
  };

  return (
    <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <button
        type="button"
        onClick={() => setCollapsed(current => !current)}
        aria-expanded={!collapsed}
        className="w-full flex items-start justify-between gap-3 flex-wrap text-left bg-transparent border-0 p-0 cursor-pointer"
      >
        <div className="flex items-start gap-2">
          <span
            aria-hidden="true"
            className={`mt-1 text-slate-400 transition-transform ${collapsed ? '' : 'rotate-90'}`}
          >
            ▶
          </span>
          <div>
            <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mt-0 mb-1">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0 mb-0">
                {description}
              </p>
            )}
          </div>
        </div>
        {headerRight}
      </button>
      {!collapsed && <div className="mt-4">{children}</div>}
    </section>
  );
}
