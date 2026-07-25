// Shared shape/formatting for
// packages/functions/src/warranty.provider.ts's getWarrantySummaryCallable
// response, kept in one place the same way maintenancePlan.ts does for the
// maintenance plan callable.

export interface WarrantyCoverage {
  type: string;
  startDate: string;
  endDate: string;
  maxMileage: number | null;
  remainingMileage: number | null;
  note?: string;
}

export interface WarrantySummary {
  status: 'active' | 'expired' | 'unknown';
  asOf: string;
  coverages: WarrantyCoverage[];
  // True when these terms came from this app's per-brand warranty table
  // rather than the generic fallback — callers must not collapse this
  // into a single undifferentiated state (mirrors
  // MaintenancePlan.modelSpecific).
  brandSpecific: boolean;
  notes: string;
}

export function formatCoverageTypeLabel(type: string): string {
  if (type === 'battery') return 'Battery & Drive Unit';
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
