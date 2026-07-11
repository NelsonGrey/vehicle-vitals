/**
 * Garage-wide document completeness — a lightweight, subtle gamification
 * signal for "how complete has the user filled in their vehicle documents."
 * Computed entirely from data already loaded for the vehicle list (no extra
 * fetches), mirroring the required/ready aggregation Home.tsx already does
 * per-vehicle in getPortfolioRequiredProgress.
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

export function computeGarageCompleteness(
  vehicles: GarageCompletenessVehicle[]
): GarageCompletenessResult {
  let requiredTotal = 0;
  let requiredComplete = 0;
  let vehiclesFullyComplete = 0;
  let vehiclesNotStarted = 0;

  for (const vehicle of vehicles) {
    const categories = vehicle.documentPortfolio?.categories || [];
    let vehicleRequired = 0;
    let vehicleComplete = 0;
    let hasAnyProgress = false;

    for (const category of categories) {
      for (const item of category.items || []) {
        if (item.required) {
          vehicleRequired += 1;
          if (item.status === 'ready') {
            vehicleComplete += 1;
          }
        }
        if (item.status && item.status !== 'missing') {
          hasAnyProgress = true;
        }
      }
    }

    requiredTotal += vehicleRequired;
    requiredComplete += vehicleComplete;

    if (vehicleRequired > 0 && vehicleComplete === vehicleRequired) {
      vehiclesFullyComplete += 1;
    }
    if (!hasAnyProgress) {
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
