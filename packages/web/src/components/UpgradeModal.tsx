import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  trackPaymentInitiated,
  trackUpgradeModalAction,
} from '../shared/adAnalytics';
import {
  getTierDisplayName,
  getTierPricing,
  getVehicleLimit,
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
  const upgradeContext = useMemo(() => {
    if (trigger === 'vehicle_limit_add_vehicle') {
      return {
        eyebrow: 'Vehicle limit reached',
        summary: `Your ${getTierDisplayName(currentTier)} plan supports up to ${getVehicleLimit(currentTier)} vehicle${getVehicleLimit(currentTier) === 1 ? '' : 's'}. ${getTierDisplayName(targetTier)} raises that limit to ${getVehicleLimit(targetTier)}.`,
        bullets: [
          `Keep your current garage without deleting an existing vehicle.`,
          `Track up to ${getVehicleLimit(targetTier)} vehicles on ${getTierDisplayName(targetTier)}.`,
          'Continue using the same reminder, records, and planning workflows across the larger garage.',
        ],
      };
    }

    if (trigger?.includes('calendar_sync')) {
      return {
        eyebrow: 'Calendar sync upgrade',
        summary: `${getTierDisplayName(targetTier)} is required for calendar exports and external scheduling actions.`,
        bullets: [
          'Create service events from planning workflows.',
          'Send tasks to supported calendar destinations.',
          'Keep maintenance planning visible outside the app.',
        ],
      };
    }

    if (trigger?.includes('export_')) {
      return {
        eyebrow: 'Export upgrade',
        summary: `${getTierDisplayName(targetTier)} is required for this maintenance history export.`,
        bullets: [
          'Create shareable service-history outputs.',
          'Keep records portable for resale, warranty, or shop visits.',
          'Unlock export workflows without leaving your current vehicle record.',
        ],
      };
    }

    if (trigger?.includes('ai_analysis')) {
      return {
        eyebrow: 'AI feature upgrade',
        summary: `${getTierDisplayName(targetTier)} is required for document analysis and related AI-assisted workflows.`,
        bullets: [
          'Analyze uploaded maintenance documents.',
          'Extract structured service details faster.',
          'Reduce manual data entry for supported document flows.',
        ],
      };
    }

    return {
      eyebrow: 'Upgrade recommended',
      summary: `This action needs the ${getTierDisplayName(targetTier)} plan. Upgrade to remove this block and keep the workflow moving.`,
      bullets: [
        `Move from ${getTierDisplayName(currentTier)} to ${getTierDisplayName(targetTier)} for this workflow.`,
        'Keep your current progress and continue in the same app flow.',
        'Review full plan details before confirming payment.',
      ],
    };
  }, [currentTier, targetTier, trigger]);

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
          {upgradeContext.eyebrow}
        </p>
        <h2
          id="upgrade-modal-title"
          className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100"
        >
          Unlock {getTierDisplayName(targetTier)}
        </h2>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          {upgradeContext.summary}
        </p>

        <ul className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-300">
          {upgradeContext.bullets.map(item => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-0.5 text-teal-700 dark:text-teal-400">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {pricing.monthlyDisplayPrice}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {pricing.annualDisplayPrice}
          </p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            Current plan: {getTierDisplayName(currentTier)}
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
