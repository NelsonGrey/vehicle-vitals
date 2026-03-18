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

// ─── types ─────────────────────────────────────────────────────────────────

interface MaintenanceEntry {
  id?: string;
  title?: string;
  serviceType?: string;
  date?: string;
  cost?: number;
}

interface AttachmentAnalysis {
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

function formatCurrency(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

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
        const [maint, allPaths] = await Promise.all([
          getMaintenanceEntries(vehicle.vin),
          // Collect all file paths from the portfolio so we can batch-fetch analyses
          Promise.resolve(
            (
              (vehicle.documentPortfolio?.categories ?? []) as Array<{
                items?: Array<{ files?: Array<{ url?: string }> }>;
              }>
            ).flatMap(cat =>
              (cat.items ?? []).flatMap(item =>
                (item.files ?? []).flatMap(f => (f.url ? [f.url] : []))
              )
            )
          ),
        ]);

        let fetchedAnalyses: AttachmentAnalysis[] = [];
        if (allPaths.length > 0) {
          fetchedAnalyses = await getAttachmentAnalyses(vehicle.vin, allPaths);
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
    const cost = a.extracted?.totalCost ?? 0;
    const cat = a.extracted?.documentCategory ?? '';
    const type = a.extracted?.serviceType?.toLowerCase() ?? '';
    const filePath = a.storagePath ?? '';

    if (filePath.includes('bill_of_sale') || type.includes('bill')) {
      purchasePrice = Math.max(purchasePrice, cost);
    } else if (
      filePath.includes('insurance') ||
      filePath.includes('insurance_card')
    ) {
      insuranceAnnual = Math.max(insuranceAnnual, cost);
    } else if (filePath.includes('loan') || filePath.includes('payment')) {
      if (cost > 0 && cost < 2000) loanMonthly = Math.max(loanMonthly, cost);
    } else if (filePath.includes('fuel')) {
      fuelTotal += cost;
    } else if (filePath.includes('inspection')) {
      inspectionTotal += cost;
    } else if (filePath.includes('registration')) {
      registrationTotal += cost;
    } else if (cat === 'invoice' || cat === 'receipt') {
      // Falls through to maintenance total already counted
    }
  }

  // Elapsed months since purchase
  const purchaseDate = vehicle.purchaseDate ?? '';
  const nowStr = new Date().toISOString().slice(0, 10);
  const elapsedMonths = purchaseDate ? monthsBetween(purchaseDate, nowStr) : 24;

  const loanPaidTotal = loanMonthly * elapsedMonths;
  const totalCOO =
    purchasePrice +
    maintTotal +
    insuranceAnnual +
    loanPaidTotal +
    fuelTotal +
    inspectionTotal +
    registrationTotal;

  const hasData = totalCOO > 0 || maintTotal > 0;

  // ── category breakdown for bar chart ────────────────────────────────────

  const breakdown: CostBreakdown[] = [
    { label: 'Purchase', amount: purchasePrice, color: 'bg-blue-500' },
    { label: 'Financing', amount: loanPaidTotal, color: 'bg-indigo-400' },
    { label: 'Service', amount: maintTotal, color: 'bg-emerald-500' },
    { label: 'Insurance', amount: insuranceAnnual, color: 'bg-amber-400' },
    { label: 'Fuel', amount: fuelTotal, color: 'bg-orange-400' },
    { label: 'Registration', amount: registrationTotal, color: 'bg-slate-400' },
    { label: 'Inspection', amount: inspectionTotal, color: 'bg-purple-400' },
  ].filter(c => c.amount > 0);

  const maxAmount = Math.max(...breakdown.map(c => c.amount), 1);
  const monthlyAvg = hasData ? totalCOO / elapsedMonths : 0;

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
          sub={`${elapsedMonths} months`}
          accent="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          label="Monthly Average"
          value={formatCurrency(monthlyAvg)}
          sub="/month"
          accent="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Service Spend"
          value={formatCurrency(maintTotal)}
          sub={`${maintenance.length} record${maintenance.length !== 1 ? 's' : ''}`}
          accent="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* ── cost breakdown bar chart ── */}
      {breakdown.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            Cost Breakdown
          </p>
          <div className="space-y-1.5">
            {breakdown.map(b => (
              <div key={b.label} className="flex items-center gap-2">
                <span className="w-20 text-xs text-slate-600 dark:text-slate-400 truncate">
                  {b.label}
                </span>
                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${b.color}`}
                    style={{ width: `${(b.amount / maxAmount) * 100}%` }}
                  />
                </div>
                <span className="w-12 text-right text-xs font-medium text-slate-700 dark:text-slate-300">
                  {formatCurrency(b.amount)}
                </span>
              </div>
            ))}
          </div>
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
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-xs"
              >
                {label}
                <span className="font-semibold">{formatCurrency(amt)}</span>
              </span>
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
