// Shared shape/formatting for packages/functions/src/schedule.provider.ts's
// getMaintenancePlanCallable response, consumed by Home.tsx,
// UpcomingTasks.tsx, and EditVehicle.tsx — kept in one place so all three
// screens format the same server response identically instead of each
// re-deriving their own label text.

export interface MaintenancePlanItem {
  serviceType: string;
  intervalMiles: number;
  intervalMonths: number;
  nextDueMileage: number;
  nextDueDate: string;
}

export interface MaintenancePlan {
  strategy: string;
  modelSpecific: boolean;
  items: MaintenancePlanItem[];
}

export function formatServiceTypeLabel(serviceType: string): string {
  return serviceType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
