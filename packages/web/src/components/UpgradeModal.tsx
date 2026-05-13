import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  trackPaymentInitiated,
  trackUpgradeModalAction,
} from '../shared/adAnalytics';
import {
  getTierDisplayName,
  getTierPricing,
  type UserTier,
} from '../shared/featureFlags';

interface UpgradeModalProps {
  isOpen: boolean;
  currentTier: UserTier;
  targetTier: UserTier;
  trigger?: string;
  onClose: () => void;
}

export default function UpgradeModal({
  isOpen,
  currentTier,
  targetTier,
  trigger,
  onClose,
}: UpgradeModalProps) {
  const navigate = useNavigate();

  const pricing = useMemo(() => getTierPricing(targetTier), [targetTier]);

  if (!isOpen) {
    return null;
  }

  const handleLearnMore = () => {
    trackUpgradeModalAction('learn_more_clicked', targetTier, currentTier);
    navigate('/app/subscription');
    onClose();
  };

  const handleUpgrade = () => {
    trackUpgradeModalAction('upgrade_clicked', targetTier, currentTier);
    trackPaymentInitiated(targetTier, 'monthly', trigger || 'upgrade_modal');
    navigate('/app/subscription');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">
          Upgrade recommended
        </p>
        <h2
          id="upgrade-modal-title"
          className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100"
        >
          Unlock {getTierDisplayName(targetTier)}
        </h2>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          This action needs the {getTierDisplayName(targetTier)} plan. Upgrade
          now to remove friction and access advanced features.
        </p>

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {pricing.monthlyDisplayPrice}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {pricing.annualDisplayPrice}
          </p>
          {pricing.annualSavings && (
            <p className="mt-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              {pricing.annualSavings}
            </p>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => {
              trackUpgradeModalAction('closed', targetTier, currentTier);
              onClose();
            }}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={handleLearnMore}
            className="rounded-md border border-teal-300 px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-300 dark:hover:bg-teal-950/40"
          >
            Learn more
          </button>
          <button
            type="button"
            onClick={handleUpgrade}
            className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Upgrade to {getTierDisplayName(targetTier)}
          </button>
        </div>
      </div>
    </div>
  );
}
