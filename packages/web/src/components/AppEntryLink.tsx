import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAppOffline } from '../shared/useAppOffline';

interface AppEntryLinkProps {
  to: string;
  className: string;
  onClick?: () => void;
  children: ReactNode;
  wrapperClassName?: string;
  noteClassName?: string;
}

/**
 * A Link into app entry flows (sign-up, sign-in, checkout) that respects the
 * app_offline Remote Config kill switch — stays visible but disabled with an
 * inline note instead of disappearing or leading to a dead end, for a
 * pre-launch window or a maintenance outage (see useAppOffline).
 */
export default function AppEntryLink({
  to,
  className,
  onClick,
  children,
  wrapperClassName = 'inline-flex flex-col items-center gap-1',
  noteClassName = 'text-xs text-slate-500 dark:text-slate-400',
}: AppEntryLinkProps) {
  const isOffline = useAppOffline();

  if (isOffline) {
    return (
      <span className={wrapperClassName}>
        <span
          aria-disabled="true"
          className={`${className} opacity-50 cursor-not-allowed pointer-events-none`}
        >
          {children}
        </span>
        <span className={noteClassName}>Currently unavailable</span>
      </span>
    );
  }

  return (
    <Link to={to} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
