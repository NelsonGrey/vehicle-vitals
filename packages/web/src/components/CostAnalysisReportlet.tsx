/**
 * CostAnalysisReportlet.tsx
 *
 * A self-contained panel that aggregates cost-of-ownership data for a single
 * vehicle and renders compact insight cards with CSS-only bar charts.
 *
 * Data sources (all loaded client-side):
 *   1. Maintenance entries → service cost history
 *   2. Attachment analyses (Firestore `attachmentAnalyses` subcollection)
 *      → purchase price (bill_of_sale), insurance premium, loan payment,
 *        fuel costs, inspection fees
 *   3. Vehicle record → current mileage, purchase date
 */

import { useEffect, useState } from 'react';
import {
  getAttachmentAnalyses,
  getMaintenanceEntries,
} from '../shared/firestoreService';
import { buildDocumentSummary } from '../utils/documentAnalysisSummary';
import { formatCurrencyCompact } from '../utils/currency';
import WheelBreakdownChart from './charts/WheelBreakdownChart';

// ─── types ─────────────────────────────────────────────────────────────────

interface MaintenanceEntry {
  id?: string;
  title?: string;
  serviceType?: string;
  date?: string;
  cost?: number;
  attachments?: Array<{
    path?: string;
    url?: string;
    analysis?: {
      extracted?: {
        documentCategory?: string;
        serviceType?: string;
        totalCost?: number;
        serviceDate?: string;
        mileage?: number;
      };
      confidence?: number;
      sourceText?: string;
    };
  }>;
}

interface AttachmentAnalysis {
  path?: string;
  url?: string;
  storagePath?: string;
  extracted?: {
    documentCategory?: string;
    serviceType?: string;
    totalCost?: number;
    currency?: string;
    serviceDate?: string;
    mileage?: number;
  };
  confidence?: number;
  sourceText?: string;
  // Portfolio category/item this file was filed under (e.g. 'ownership' /
  // 'bill_of_sale'), attached client-side once fetched. Undefined when the
  // file came from a logged Maintenance entry's attachments instead of the
  // document portfolio — see isMaintenanceAttachment.
  categoryKey?: string;
  itemId?: string;
  // True when this analysis belongs to a file attached directly to a logged
  // Maintenance entry. That entry's cost already contributes to maintTotal
  // via its own `cost` field, so these are excluded from cost-bucket
  // classification below to avoid double-counting the same service twice.
  isMaintenanceAttachment?: boolean;
}

interface VehicleInfo {
  vin: string;
  year?: string;
  make?: string;
  model?: string;
  mileage?: string;
  purchaseDate?: string;
  documentPortfolio?: {
    categories?: unknown;
  };
}

interface CostBreakdown {
  label: string;
  amount: number;
  color: string;
}

// ─── helpers ───────────────────────────────────────────────────────────────

const formatCurrency = formatCurrencyCompact;

function monthsBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.max(
    1,
    (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
  );
}

// ─── component ─────────────────────────────────────────────────────────────

interface Props {
  vehicle: VehicleInfo;
}

export default function CostAnalysisReportlet({ vehicle }: Props) {
  const [maintenance, setMaintenance] = useState<MaintenanceEntry[]>([]);
  const [analyses, setAnalyses] = useState<AttachmentAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vehicle.vin) return;

    let cancelled = false;

    async function load() {
      try {
        const maint = (await getMaintenanceEntries(vehicle.vin)) ?? [];

        // Collect storage paths from both document portfolio files and
        // maintenance attachments, keeping track of which portfolio
        // category/item each portfolio file was actually filed under — the
        // authoritative signal for what a document is FOR (a Bill of Sale
        // filed under Ownership vs. a receipt filed under Maintenance),
        // rather than guessing from keywords in the storage path/filename.
        const portfolioMeta = new Map<
          string,
          { categoryKey?: string; itemId?: string }
        >();
        (
          (vehicle.documentPortfolio?.categories ?? []) as Array<{
            key?: string;
            items?: Array<{
              id?: string;
              files?: Array<{ path?: string; url?: string }>;
            }>;
          }>
        ).forEach(cat => {
          (cat.items ?? []).forEach(item => {
            (item.files ?? []).forEach(file => {
              const path = file.path || file.url;
              if (path) {
                portfolioMeta.set(path, { categoryKey: cat.key, itemId: item.id });
              }
            });
          });
        });

        const maintenancePaths = new Set<string>();
        maint.forEach(entry => {
          (entry.attachments ?? []).forEach(attachment => {
            const path = attachment.path || attachment.url;
            if (path) maintenancePaths.add(path);
          });
        });

        const allPaths = Array.from(
          new Set([...portfolioMeta.keys(), ...maintenancePaths])
        );

        let fetchedAnalyses: AttachmentAnalysis[] = [];
        if (allPaths.length > 0) {
          const raw = await getAttachmentAnalyses(vehicle.vin, allPaths);
          fetchedAnalyses = raw.map(a => {
            const path = a.storagePath || a.path || a.url || '';
            const meta = portfolioMeta.get(path);
            return {
              ...a,
              categoryKey: meta?.categoryKey,
              itemId: meta?.itemId,
              isMaintenanceAttachment: !meta && maintenancePaths.has(path),
            };
          });
        }

        if (!cancelled) {
          setMaintenance(maint ?? []);
          setAnalyses(fetchedAnalyses ?? []);
        }
      } catch {
        // Non-critical — reportlet just shows what it can
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [vehicle.vin, vehicle.documentPortfolio]);

  // ── aggregate costs ──────────────────────────────────────────────────────

  const maintTotal = maintenance.reduce((sum, m) => sum + (m.cost ?? 0), 0);

  let purchasePrice = 0;
  let insuranceAnnual = 0;
  let loanMonthly = 0;
  let fuelTotal = 0;
  let inspectionTotal = 0;
  let registrationTotal = 0;

  for (const a of analyses) {
    // Files attached to a logged Maintenance entry already contribute to
    // maintTotal via that entry's own `cost` field — classifying them here
    // too would double-count the same service.
    if (a.isMaintenanceAttachment) continue;

    const cost = a.extracted?.totalCost ?? 0;
    if (!(cost > 0)) continue;

    // Classify by the portfolio item the user actually filed the document
    // under, not by guessing from the storage path/filename — a keyword
    // guess is exactly the bug class that inflated another total in this
    // app by $100,000+ (see ownershipInsights.ts).
    switch (a.itemId) {
      case 'bill_of_sale':
        purchasePrice = Math.max(purchasePrice, cost);
        break;
      case 'insurance':
        insuranceAnnual = Math.max(insuranceAnnual, cost);
        break;
      case 'loan_or_lease':
      case 'payment_history':
        if (cost < 2000) loanMonthly = Math.max(loanMonthly, cost);
        break;
      case 'registration':
      case 'tax_receipts':
        registrationTotal += cost;
        break;
      case 'inspection_reports':
        inspectionTotal += cost;
        break;
      default:
        // title, warranty_records, service_history/repair_invoices (already
        // reflected via Records' Ownership Insights maintenance spend),
        // reference docs, or a file outside the standard portfolio — not
        // part of this cost breakdown.
        break;
    }
  }

  // Elapsed months since purchase. Previously defaulted to a fabricated 24
  // when purchaseDate was missing — now null, so financing/monthly-average
  // figures that depend on ownership duration are omitted rather than
  // silently built on a made-up number.
  const purchaseDate = vehicle.purchaseDate ?? '';
  const nowStr = new Date().toISOString().slice(0, 10);
  const elapsedMonths = purchaseDate
    ? monthsBetween(purchaseDate, nowStr)
    : null;
  const missingPurchaseDate = !purchaseDate;

  const loanPaidTotal = elapsedMonths != null ? loanMonthly * elapsedMonths : 0;
  // Insurance is captured as a single annual premium — prorate by years
  // owned so it contributes to a CUMULATIVE total the same way maintenance/
  // fuel/registration do, instead of counting one year's premium as the
  // full lifetime insurance cost regardless of how long the vehicle's been
  // owned. Without a known ownership duration, fall back to the single
  // premium as-is rather than guessing.
  const insuranceCumulative =
    elapsedMonths != null
      ? Number(((insuranceAnnual * elapsedMonths) / 12).toFixed(2))
      : insuranceAnnual;
  const totalCOO =
    purchasePrice +
    maintTotal +
    insuranceCumulative +
    loanPaidTotal +
    fuelTotal +
    inspectionTotal +
    registrationTotal;

  // loanMonthly/insuranceAnnual are checked directly (not just via
  // totalCOO) because a detected-but-unprorated financing payment
  // contributes 0 to totalCOO when purchase date is unknown — that's still
  // real data worth surfacing (with a note), not an empty state.
  const hasData =
    totalCOO > 0 || maintTotal > 0 || loanMonthly > 0 || insuranceAnnual > 0;

  // ── category breakdown for bar chart ────────────────────────────────────

  const breakdown: CostBreakdown[] = [
    { label: 'Purchase', amount: purchasePrice, color: '#3b82f6' },
    { label: 'Financing', amount: loanPaidTotal, color: '#818cf8' },
    { label: 'Service', amount: maintTotal, color: '#22c55e' },
    { label: 'Insurance', amount: insuranceCumulative, color: '#f59e0b' },
    { label: 'Fuel', amount: fuelTotal, color: '#fbbf24' },
    { label: 'Registration', amount: registrationTotal, color: '#94a3b8' },
    { label: 'Inspection', amount: inspectionTotal, color: '#a78bfa' },
  ].filter(c => c.amount > 0);

  // Can't average cost-per-month without knowing how many months the
  // vehicle's actually been owned.
  const monthlyAvg =
    hasData && elapsedMonths != null ? totalCOO / elapsedMonths : null;

  const documentInsights = analyses
    .filter(a => a.extracted || a.sourceText)
    .sort((a, b) => {
      const aDate = a.extracted?.serviceDate
        ? new Date(a.extracted.serviceDate).getTime()
        : 0;
      const bDate = b.extracted?.serviceDate
        ? new Date(b.extracted.serviceDate).getTime()
        : 0;
      return bDate - aDate;
    })
    .slice(0, 5);

  // ── maintenance category breakdown ──────────────────────────────────────

  const maintByType: Record<string, number> = {};
  for (const m of maintenance) {
    const label = formatServiceType(m.serviceType ?? '');
    maintByType[label] = (maintByType[label] ?? 0) + (m.cost ?? 0);
  }
  const topMaint = Object.entries(maintByType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  if (loading) {
    return (
      <div className="py-4 px-1">
        <div className="text-xs text-slate-400 animate-pulse">
          Loading cost analysis…
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="py-3 px-1">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Upload vehicle documents to unlock cost-of-ownership analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── headline stats ── */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard
          label="Total Cost of Ownership"
          value={formatCurrency(totalCOO)}
          sub={elapsedMonths != null ? `${elapsedMonths} months` : 'excl. financing'}
          accent="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          label="Monthly Average"
          value={monthlyAvg != null ? formatCurrency(monthlyAvg) : 'Add purchase date'}
          sub="/month"
          accent="text-accent-600 dark:text-accent-400"
        />
        <StatCard
          label="Service Spend"
          value={formatCurrency(maintTotal)}
          sub={`${maintenance.length} record${maintenance.length !== 1 ? 's' : ''}`}
          accent="text-warning-600 dark:text-warning-400"
        />
      </div>

      {missingPurchaseDate && (loanMonthly > 0 || insuranceAnnual > 0) && (
        <p className="text-xs text-warning-700 dark:text-warning-400">
          Add this vehicle's purchase date to include financing paid to date
          and a full multi-year insurance estimate in these totals.
        </p>
      )}

      {/* ── cost breakdown wheel chart ── */}
      {breakdown.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            Cost Breakdown
          </p>
          <WheelBreakdownChart
            segments={breakdown}
            formatAmount={formatCurrency}
            centerValue={formatCurrency(totalCOO)}
            centerLabel="Total"
          />
        </div>
      )}

      {/* ── top maintenance categories ── */}
      {topMaint.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            Service Categories
          </p>
          <div className="flex flex-wrap gap-1.5">
            {topMaint.map(([label, amt]) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 rounded-full text-xs"
              >
                {label}
                <span className="font-semibold">{formatCurrency(amt)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {documentInsights.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            Document-Derived Insights
          </p>
          <div className="space-y-1.5">
            {documentInsights.map((analysis, index) => (
              <div
                key={`${analysis.storagePath || analysis.path || analysis.url || 'analysis'}-${index}`}
                className="text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-2 py-1.5"
              >
                <div className="text-slate-700 dark:text-slate-300">
                  {buildDocumentSummary(
                    analysis.extracted,
                    analysis.sourceText
                  )}
                </div>
                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Confidence:{' '}
                  {typeof analysis.confidence === 'number'
                    ? `${Math.round(analysis.confidence * 100)}%`
                    : 'n/a'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── purchase snapshot ── */}
      {purchasePrice > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-2">
          <span>Purchase price</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {formatCurrency(purchasePrice)}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── sub-components ────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl px-3 py-2 text-center">
      <p className={`text-lg font-bold leading-tight ${accent}`}>{value}</p>
      <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5">
        {sub}
      </p>
      <p className="text-slate-600 dark:text-slate-400 text-[10px] leading-snug mt-1">
        {label}
      </p>
    </div>
  );
}

// ─── utilities ─────────────────────────────────────────────────────────────

function formatServiceType(raw: string): string {
  if (!raw) return 'Other';
  return raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\b(K)\b/g, 'k');
}
