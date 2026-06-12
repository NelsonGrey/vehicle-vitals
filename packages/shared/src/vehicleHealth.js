const DEFAULT_MONTHLY_MILES = 900;

export const VEHICLE_HEALTH_COMPONENTS = [
  {
    id: 'oil_change',
    label: 'Oil',
    intervalMiles: 5000,
    intervalDays: 180,
    costLow: 70,
    costHigh: 140,
  },
  {
    id: 'tire_rotation',
    label: 'Rotation',
    intervalMiles: 6000,
    intervalDays: 240,
    costLow: 25,
    costHigh: 60,
  },
  {
    id: 'tire_replacement',
    label: 'Tires',
    intervalMiles: 50000,
    intervalDays: 1460,
    costLow: 600,
    costHigh: 1400,
  },
  {
    id: 'brake_service',
    label: 'Brakes',
    intervalMiles: 40000,
    intervalDays: 1095,
    costLow: 300,
    costHigh: 900,
  },
  {
    id: 'battery_replacement',
    label: 'Battery',
    intervalMiles: 45000,
    intervalDays: 1460,
    costLow: 160,
    costHigh: 320,
  },
  {
    id: 'wiper_replacement',
    label: 'Wipers',
    intervalMiles: null,
    intervalDays: 365,
    costLow: 20,
    costHigh: 60,
  },
];

function parseMileage(value) {
  const parsed = Number.parseInt(String(value ?? '').replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function daysBetween(start, end) {
  const ms = end.getTime() - start.getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

function addDays(date, days) {
  const copy = new Date(date.getTime());
  copy.setDate(copy.getDate() + days);
  return copy;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeText(...values) {
  return values
    .filter(Boolean)
    .map(value => String(value).toLowerCase())
    .join(' ');
}

export function inferHealthComponentIds(entry) {
  const text = normalizeText(
    entry?.serviceType,
    entry?.title,
    entry?.description,
    entry?.notes
  );

  const ids = [];

  if (/oil|filter change|lubrication/.test(text)) {
    ids.push('oil_change');
  }
  if (/tire rotation|rotate tires|rotate tire|rotated tires|rotated tire/.test(text)) {
    ids.push('tire_rotation');
  }
  if (
    /(replace|replacement|install|mounted).*(tire|tires)|(tire|tires).*(replace|replacement|install)/.test(
      text
    )
  ) {
    ids.push('tire_replacement');
  }
  if (/brake|brake pad|rotor|caliper/.test(text)) {
    ids.push('brake_service');
  }
  if (/battery/.test(text)) {
    ids.push('battery_replacement');
  }
  if (/wiper|windshield blade|washer blade/.test(text)) {
    ids.push('wiper_replacement');
  }

  return Array.from(new Set(ids));
}

function getMileageCadence(vehicle, maintenanceEntries, now) {
  const currentMileage = parseMileage(vehicle?.mileage);
  const points = maintenanceEntries
    .map(entry => {
      const mileage = parseMileage(entry?.mileage);
      const date = entry?.date ? new Date(entry.date) : null;
      if (!mileage || !date || Number.isNaN(date.getTime())) {
        return null;
      }
      return { mileage, date };
    })
    .filter(Boolean)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (currentMileage > 0) {
    points.push({ mileage: currentMileage, date: now });
  }

  if (points.length >= 2) {
    const first = points[0];
    const last = points[points.length - 1];
    const mileageDelta = Math.max(0, last.mileage - first.mileage);
    const dayDelta = Math.max(30, daysBetween(first.date, last.date));
    const monthly = Math.round((mileageDelta / dayDelta) * 30);
    if (monthly > 0) {
      return clamp(monthly, 200, 2500);
    }
  }

  const purchaseDate = vehicle?.purchaseDate ? new Date(vehicle.purchaseDate) : null;
  if (
    purchaseDate &&
    !Number.isNaN(purchaseDate.getTime()) &&
    currentMileage > 0 &&
    purchaseDate < now
  ) {
    const ownershipDays = Math.max(30, daysBetween(purchaseDate, now));
    const monthly = Math.round((currentMileage / ownershipDays) * 30);
    return clamp(monthly, 200, 2500);
  }

  return DEFAULT_MONTHLY_MILES;
}

function buildAnchor(componentId, vehicle, maintenanceEntries) {
  const matchingEntry = maintenanceEntries
    .filter(entry => inferHealthComponentIds(entry).includes(componentId))
    .sort((a, b) => {
      const aDate = new Date(a?.date || 0).getTime();
      const bDate = new Date(b?.date || 0).getTime();
      return bDate - aDate;
    })[0];

  if (matchingEntry) {
    return {
      source: 'record',
      recordId: matchingEntry.id,
      date: matchingEntry.date ? new Date(matchingEntry.date) : null,
      mileage: parseMileage(matchingEntry.mileage) || null,
      hasDate: Boolean(matchingEntry.date),
      hasMileage: parseMileage(matchingEntry.mileage) > 0,
    };
  }

  const purchaseDate = vehicle?.purchaseDate ? new Date(vehicle.purchaseDate) : null;
  if (purchaseDate && !Number.isNaN(purchaseDate.getTime())) {
    return {
      source: 'default',
      date: purchaseDate,
      mileage: 0,
      hasDate: true,
      hasMileage: false,
    };
  }

  return {
    source: 'default',
    date: null,
    mileage: null,
    hasDate: false,
    hasMileage: false,
  };
}

function toConfidenceBand(score) {
  if (score >= 0.75) return 'high';
  if (score >= 0.5) return 'medium';
  return 'low';
}

function getStatusFromPercent(percent) {
  if (percent <= 0) return 'overdue';
  if (percent <= 0.15) return 'service_soon';
  if (percent <= 0.35) return 'watch';
  return 'good';
}

function buildExplanation(component, anchor, status, milesPerMonth) {
  const base = [];
  if (anchor.source === 'record') {
    base.push('Based on your last recorded service entry.');
  } else {
    base.push('Using baseline interval assumptions because service history is limited.');
  }

  base.push(`Forecast assumes about ${milesPerMonth.toLocaleString()} miles per month.`);

  if (status !== 'good') {
    base.push('Keep mileage and service records current to improve estimate accuracy.');
  }

  return base;
}

export function computeVehicleHealthSnapshot(vehicle, maintenanceEntries = [], options = {}) {
  const now = options.now instanceof Date ? options.now : new Date();
  const currentMileage = parseMileage(vehicle?.mileage);
  const milesPerMonth = getMileageCadence(vehicle, maintenanceEntries, now);
  const milesPerDay = Math.max(1, Math.round(milesPerMonth / 30));

  const components = VEHICLE_HEALTH_COMPONENTS.map(component => {
    const anchor = buildAnchor(component.id, vehicle, maintenanceEntries);
    const elapsedMiles =
      anchor.mileage != null ? Math.max(0, currentMileage - anchor.mileage) : null;
    const elapsedDays =
      anchor.date != null ? daysBetween(anchor.date, now) : null;

    let remainingMiles = null;
    let remainingDays = null;
    let dueMileage = null;
    let dueDate = null;
    const percentCandidates = [];

    if (component.intervalMiles) {
      if (elapsedMiles != null) {
        remainingMiles = component.intervalMiles - elapsedMiles;
      } else if (currentMileage > 0) {
        const consumed = currentMileage % component.intervalMiles;
        remainingMiles = component.intervalMiles - consumed;
      }

      if (remainingMiles != null) {
        dueMileage = currentMileage + remainingMiles;
        percentCandidates.push(remainingMiles / component.intervalMiles);
      }
    }

    if (component.intervalDays) {
      if (elapsedDays != null) {
        remainingDays = component.intervalDays - elapsedDays;
      }

      if (remainingDays != null) {
        dueDate = addDays(now, remainingDays);
        percentCandidates.push(remainingDays / component.intervalDays);
      } else if (remainingMiles != null) {
        const convertedDays = Math.round(remainingMiles / milesPerDay);
        remainingDays = convertedDays;
        dueDate = addDays(now, convertedDays);
      }
    }

    const remainingLifePercent =
      percentCandidates.length > 0
        ? clamp(Math.min(...percentCandidates), -0.5, 1)
        : null;

    let confidenceScore = 0.35;
    if (anchor.source === 'record' && anchor.hasDate && anchor.hasMileage) {
      confidenceScore = 0.88;
    } else if (anchor.source === 'record' && (anchor.hasDate || anchor.hasMileage)) {
      confidenceScore = 0.68;
    } else if (currentMileage > 0) {
      confidenceScore = 0.4;
    }

    if (milesPerMonth !== DEFAULT_MONTHLY_MILES) {
      confidenceScore = clamp(confidenceScore + 0.05, 0, 0.95);
    }

    const status = getStatusFromPercent(remainingLifePercent ?? 0.2);

    return {
      componentId: component.id,
      label: component.label,
      status,
      confidenceScore,
      confidenceBand: toConfidenceBand(confidenceScore),
      remainingLifePercent,
      remainingMiles,
      remainingDays,
      estimatedDueMileage: dueMileage,
      estimatedDueDate: dueDate ? dueDate.toISOString().slice(0, 10) : null,
      estimatedCostLow: component.costLow,
      estimatedCostHigh: component.costHigh,
      anchorSource: anchor.source,
      anchorRecordId: anchor.recordId,
      explanation: buildExplanation(component, anchor, status, milesPerMonth),
    };
  });

  const weightedPercent = components.reduce((sum, component) => {
    const percent = component.remainingLifePercent ?? 0.4;
    return sum + clamp(percent, 0, 1);
  }, 0);

  let overallHealthScore = Math.round((weightedPercent / components.length) * 100);
  const overdueCount = components.filter(component => component.status === 'overdue').length;
  const soonCount = components.filter(
    component => component.status === 'service_soon'
  ).length;

  overallHealthScore -= overdueCount * 18;
  overallHealthScore -= soonCount * 8;
  overallHealthScore = clamp(overallHealthScore, 12, 99);

  const overallConfidenceScore =
    components.reduce((sum, component) => sum + component.confidenceScore, 0) /
    components.length;

  const rankedByUrgency = [...components].sort((a, b) => {
    const aDays = a.remainingDays ?? Number.POSITIVE_INFINITY;
    const bDays = b.remainingDays ?? Number.POSITIVE_INFINITY;
    if (aDays !== bDays) return aDays - bDays;
    const aMiles = a.remainingMiles ?? Number.POSITIVE_INFINITY;
    const bMiles = b.remainingMiles ?? Number.POSITIVE_INFINITY;
    return aMiles - bMiles;
  });

  const spendInWindow = months => {
    const horizonDays = months * 30;
    const horizonMiles = milesPerMonth * months;
    return rankedByUrgency.reduce(
      (totals, component) => {
        const dueInWindow =
          (typeof component.remainingDays === 'number' &&
            component.remainingDays <= horizonDays) ||
          (typeof component.remainingMiles === 'number' &&
            component.remainingMiles <= horizonMiles);

        if (!dueInWindow) {
          return totals;
        }

        return {
          low: totals.low + (component.estimatedCostLow || 0),
          high: totals.high + (component.estimatedCostHigh || 0),
        };
      },
      { low: 0, high: 0 }
    );
  };

  const spend90d = spendInWindow(3);
  const spend12m = spendInWindow(12);
  const spend36m = spendInWindow(36);

  const lowConfidenceCount = components.filter(
    component => component.confidenceBand === 'low'
  ).length;
  const missingServiceHistory = maintenanceEntries.length === 0;

  const accuracyTip = missingServiceHistory
    ? 'Add your recent oil, tire, brake, battery, and wiper service history to unlock higher-confidence forecasts.'
    : lowConfidenceCount > 0
      ? 'Keep mileage and service entries current so remaining-life estimates stay accurate.'
      : 'Your recent service history is helping keep these forecasts accurate.';

  return {
    vin: vehicle?.vin || '',
    generatedAt: now.toISOString(),
    overallHealthScore,
    overallConfidenceScore,
    overallConfidenceBand: toConfidenceBand(overallConfidenceScore),
    nextLikelyService: rankedByUrgency[0]?.label || null,
    estimatedMilesPerMonth: milesPerMonth,
    estimatedSpend90dLow: spend90d.low,
    estimatedSpend90dHigh: spend90d.high,
    estimatedSpend12mLow: spend12m.low,
    estimatedSpend12mHigh: spend12m.high,
    estimatedSpend36mLow: spend36m.low,
    estimatedSpend36mHigh: spend36m.high,
    components: rankedByUrgency,
    accuracyTip,
    missingServiceHistory,
    lowConfidenceCount,
  };
}
