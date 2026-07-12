export interface MaintenancePlanItem {
  serviceType: string;
  intervalMiles: number;
  intervalMonths: number;
  nextDueMileage: number;
  nextDueDate: string;
}

export interface MaintenancePlan {
  strategy: string;
  // True when this plan came from a manufacturer-specific interval table
  // (see MANUFACTURER_SCHEDULES below) rather than the generic fallback —
  // callers use this to distinguish "we have real data for your vehicle"
  // from "no manufacturer data, showing a generic estimate" instead of
  // rendering both cases identically.
  modelSpecific: boolean;
  items: MaintenancePlanItem[];
}

/**
 * Format date as YYYY-MM-DD.
 * @param {Date} d Date value
 * @return {string} ISO date string
 */
function toIsoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

/**
 * Compute next due mileage for an interval — the next unvisited multiple of
 * intervalMiles strictly above currentMileage (e.g. interval 10000 at
 * currentMileage 25000 is due at 30000, not 40000).
 * @param {number} currentMileage Current mileage
 * @param {number} intervalMiles Service interval
 * @return {number} Next due mileage
 */
function nextMileage(currentMileage: number, intervalMiles: number): number {
  return (Math.floor(currentMileage / intervalMiles) + 1) * intervalMiles;
}

/**
 * Estimate due date from mileage gap and interval window.
 * @param {number} currentMileage Current mileage
 * @param {number} nextDueMileage Next due mileage
 * @param {number} intervalMonths Interval window in months
 * @return {string} Estimated due date
 */
function estimateDueDate(
  currentMileage: number,
  nextDueMileage: number,
  intervalMonths: number
): string {
  const now = new Date();
  const milesRemaining = Math.max(0, nextDueMileage - currentMileage);
  // 35 mi/day (1050/month) matches web's "Average driving" default
  // (packages/web/src/pages/UpcomingTasks.tsx's effectiveDailyMiles) and
  // mobile's upcoming_tasks_screen.dart — previously this used a separate,
  // undocumented ~33 mi/day assumption. Keep these three in sync.
  const milesPerMonth = 1050;
  const monthOffset = Math.max(
    1,
    Math.min(intervalMonths, Math.ceil(milesRemaining / milesPerMonth))
  );
  const due = new Date(now);
  due.setMonth(due.getMonth() + monthOffset);
  return toIsoDate(due);
}

interface ScheduleTemplateItem {
  serviceType: string;
  intervalMiles: number;
}

// Manufacturer-specific mileage intervals, ported from
// packages/shared/src/maintenanceSchedules.js's manufacturerSchedules
// (kept there too, as the client-side offline/local-fallback copy — see
// that file's own header comment). The source data only has a free-text
// `frequency` string like "Every 5,000 miles or 6 months", not a
// structured month interval — DEFAULT_INTERVAL_MONTHS below assigns one
// per service type instead of parsing that text.
const MANUFACTURER_SCHEDULES: Record<
  string,
  Record<string, ScheduleTemplateItem[]>
> = {
  Toyota: {
    Camry: [
      {serviceType: "oil_change", intervalMiles: 5000},
      {serviceType: "tire_rotation", intervalMiles: 5000},
      {serviceType: "brake_inspection", intervalMiles: 10000},
      {serviceType: "transmission_service", intervalMiles: 30000},
    ],
    Corolla: [
      {serviceType: "oil_change", intervalMiles: 5000},
      {serviceType: "tire_rotation", intervalMiles: 5000},
      {serviceType: "air_filter", intervalMiles: 15000},
    ],
  },
  Honda: {
    Civic: [
      {serviceType: "oil_change", intervalMiles: 7500},
      {serviceType: "tire_rotation", intervalMiles: 7500},
      {serviceType: "brake_inspection", intervalMiles: 15000},
    ],
    Accord: [
      {serviceType: "oil_change", intervalMiles: 7500},
      {serviceType: "tire_rotation", intervalMiles: 7500},
      {serviceType: "transmission_service", intervalMiles: 30000},
    ],
  },
  Ford: {
    "F-150": [
      {serviceType: "oil_change", intervalMiles: 7500},
      {serviceType: "tire_rotation", intervalMiles: 7500},
      {serviceType: "brake_inspection", intervalMiles: 12500},
    ],
    Explorer: [
      {serviceType: "oil_change", intervalMiles: 7500},
      {serviceType: "tire_rotation", intervalMiles: 7500},
      {serviceType: "air_filter", intervalMiles: 15000},
    ],
  },
};

const GENERIC_TEMPLATE: ScheduleTemplateItem[] = [
  {serviceType: "oil_change", intervalMiles: 5000},
  {serviceType: "tire_rotation", intervalMiles: 5000},
  {serviceType: "brake_inspection", intervalMiles: 10000},
];

const DEFAULT_INTERVAL_MONTHS: Record<string, number> = {
  oil_change: 6,
  tire_rotation: 6,
  brake_inspection: 12,
  transmission_service: 60,
  air_filter: 12,
};

/**
 * Looks up the manufacturer-specific schedule for a make/model, if this
 * app has one on file. Case/whitespace-insensitive so VIN-decoded
 * make/model values (which may come back as e.g. "TOYOTA") still match.
 * @param {string} [make] Vehicle make.
 * @param {string} [model] Vehicle model.
 * @return {ScheduleTemplateItem[] | null} The schedule, or null if this
 *   make/model isn't covered.
 */
function lookupManufacturerSchedule(
  make?: string,
  model?: string
): ScheduleTemplateItem[] | null {
  const normalizedMake = (make || "").trim().toLowerCase();
  const normalizedModel = (model || "").trim().toLowerCase();
  if (!normalizedMake || !normalizedModel) return null;

  for (const [scheduleMake, models] of Object.entries(
    MANUFACTURER_SCHEDULES
  )) {
    if (scheduleMake.toLowerCase() !== normalizedMake) continue;
    for (const [scheduleModel, items] of Object.entries(models)) {
      if (scheduleModel.toLowerCase() === normalizedModel) {
        return items;
      }
    }
  }
  return null;
}

/**
 * Build a normalized maintenance plan from current mileage, using a
 * manufacturer-specific interval table when this app has one on file for
 * the vehicle's make/model, and a generic 3-item template otherwise. Does
 * NOT merge the two into one undifferentiated engine — see
 * MaintenancePlan.modelSpecific.
 * @param {number} currentMileage Current mileage
 * @param {string} [make] Vehicle make
 * @param {string} [model] Vehicle model
 * @return {MaintenancePlan} Computed maintenance plan
 */
export function buildMaintenancePlan(
  currentMileage: number,
  make?: string,
  model?: string
): MaintenancePlan {
  const manufacturerSchedule = lookupManufacturerSchedule(make, model);
  const template = manufacturerSchedule || GENERIC_TEMPLATE;

  const items = template.map((item) => {
    const intervalMonths = DEFAULT_INTERVAL_MONTHS[item.serviceType] || 12;
    const dueMileage = nextMileage(currentMileage, item.intervalMiles);
    return {
      serviceType: item.serviceType,
      intervalMiles: item.intervalMiles,
      intervalMonths,
      nextDueMileage: dueMileage,
      nextDueDate: estimateDueDate(currentMileage, dueMileage, intervalMonths),
    };
  });

  return {
    strategy: manufacturerSchedule
      ? "manufacturer_schedule_v1"
      : "static_schedule_v1",
    modelSpecific: Boolean(manufacturerSchedule),
    items,
  };
}
