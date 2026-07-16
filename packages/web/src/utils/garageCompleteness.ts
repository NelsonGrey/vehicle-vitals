/**
 * Garage-wide document completeness — a lightweight, subtle gamification
 * signal for "how complete has the user filled in their vehicle documents."
 * Computed entirely from data already loaded for the vehicle list (no extra
 * fetches). The per-vehicle required/ready reduction this builds on
 * (computeVehiclePortfolioProgress) is also what Home.tsx uses directly for
 * its own per-vehicle "N/M required complete" display — previously that was
 * a second, independent copy of the same reduction living in Home.tsx
 * itself.
 */

export type GarageCompletenessTier = 'rookie' | 'pro' | 'champion';

export interface GarageCompletenessVehicle {
  vin: string;
  documentPortfolio?: {
    categories?: Array<{
      items?: Array<{ required?: boolean; status?: string }>;
    }>;
  };
}

export interface VehiclePortfolioProgress {
  required: number;
  complete: number;
  optionalTotal: number;
  optionalComplete: number;
  hasAnyProgress: boolean;
}

export function computeVehiclePortfolioProgress(
  vehicle: GarageCompletenessVehicle
): VehiclePortfolioProgress {
  const categories = vehicle.documentPortfolio?.categories || [];
  let required = 0;
  let complete = 0;
  let optionalTotal = 0;
  let optionalComplete = 0;
  let hasAnyProgress = false;

  for (const category of categories) {
    for (const item of category.items || []) {
      if (item.required) {
        required += 1;
        if (item.status === 'ready') {
          complete += 1;
        }
      } else {
        optionalTotal += 1;
        if (item.status === 'ready') {
          optionalComplete += 1;
        }
      }
      if (item.status && item.status !== 'missing') {
        hasAnyProgress = true;
      }
    }
  }

  return { required, complete, optionalTotal, optionalComplete, hasAnyProgress };
}

export interface GarageCompletenessResult {
  completenessPercent: number;
  requiredTotal: number;
  requiredComplete: number;
  vehiclesTracked: number;
  vehiclesFullyComplete: number;
  vehiclesNotStarted: number;
  tier: GarageCompletenessTier;
}

const TIER_LABELS: Record<GarageCompletenessTier, string> = {
  rookie: 'Rookie',
  pro: 'Pro',
  champion: 'Champion',
};

const TIER_FLAGS: Record<GarageCompletenessTier, string> = {
  rookie: '🏁',
  pro: '🏎️',
  champion: '🏆',
};

function tierForPercent(percent: number): GarageCompletenessTier {
  if (percent >= 90) return 'champion';
  if (percent >= 50) return 'pro';
  return 'rookie';
}

export function getGarageCompletenessTierLabel(
  tier: GarageCompletenessTier
): string {
  return TIER_LABELS[tier];
}

export function getGarageCompletenessTierFlag(
  tier: GarageCompletenessTier
): string {
  return TIER_FLAGS[tier];
}

export function computeGarageCompleteness(
  vehicles: GarageCompletenessVehicle[]
): GarageCompletenessResult {
  let requiredTotal = 0;
  let requiredComplete = 0;
  let vehiclesFullyComplete = 0;
  let vehiclesNotStarted = 0;

  for (const vehicle of vehicles) {
    const progress = computeVehiclePortfolioProgress(vehicle);

    requiredTotal += progress.required;
    requiredComplete += progress.complete;

    if (progress.required > 0 && progress.complete === progress.required) {
      vehiclesFullyComplete += 1;
    }
    if (!progress.hasAnyProgress) {
      vehiclesNotStarted += 1;
    }
  }

  const completenessPercent =
    requiredTotal > 0 ? Math.round((requiredComplete / requiredTotal) * 100) : 0;

  return {
    completenessPercent,
    requiredTotal,
    requiredComplete,
    vehiclesTracked: vehicles.length,
    vehiclesFullyComplete,
    vehiclesNotStarted,
    tier: tierForPercent(completenessPercent),
  };
}
