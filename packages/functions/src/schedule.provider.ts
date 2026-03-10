export interface MaintenancePlanItem {
  serviceType: string;
  intervalMiles: number;
  intervalMonths: number;
  nextDueMileage: number;
  nextDueDate: string;
}

export interface MaintenancePlan {
  strategy: string;
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
 * Compute next due mileage for an interval.
 * @param {number} currentMileage Current mileage
 * @param {number} intervalMiles Service interval
 * @return {number} Next due mileage
 */
function nextMileage(currentMileage: number, intervalMiles: number): number {
  const rounded = Math.ceil(currentMileage / intervalMiles) * intervalMiles;
  return rounded + intervalMiles;
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
  const milesPerMonth = 1000;
  const monthOffset = Math.max(
    1,
    Math.min(intervalMonths, Math.ceil(milesRemaining / milesPerMonth))
  );
  const due = new Date(now);
  due.setMonth(due.getMonth() + monthOffset);
  return toIsoDate(due);
}

/**
 * Build a normalized maintenance plan from current mileage.
 * @param {number} currentMileage Current mileage
 * @return {MaintenancePlan} Computed maintenance plan
 */
export function buildMaintenancePlan(currentMileage: number): MaintenancePlan {
  const template = [
    {serviceType: "oil_change", intervalMiles: 5000, intervalMonths: 6},
    {serviceType: "tire_rotation", intervalMiles: 5000, intervalMonths: 6},
    {
      serviceType: "brake_inspection",
      intervalMiles: 10000,
      intervalMonths: 12,
    },
  ];

  const items = template.map((item) => {
    const dueMileage = nextMileage(currentMileage, item.intervalMiles);
    return {
      serviceType: item.serviceType,
      intervalMiles: item.intervalMiles,
      intervalMonths: item.intervalMonths,
      nextDueMileage: dueMileage,
      nextDueDate: estimateDueDate(
        currentMileage,
        dueMileage,
        item.intervalMonths
      ),
    };
  });

  return {
    strategy: "static_schedule_v1",
    items,
  };
}
