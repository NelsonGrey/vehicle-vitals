// Canonical VIN/HIN identifier validation (ISO 3779 check-digit algorithm).
// Previously duplicated byte-for-byte between packages/web and
// packages/functions — moved here as the single source. Kept as an
// isomorphic module rather than a callable: this needs to run at
// keystroke speed for instant form feedback, and a network round-trip
// here would be actively harmful, not just unnecessary latency.

const VIN_TRANSLITERATION: Record<string, number> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
  F: 6,
  G: 7,
  H: 8,
  J: 1,
  K: 2,
  L: 3,
  M: 4,
  N: 5,
  P: 7,
  R: 9,
  S: 2,
  T: 3,
  U: 4,
  V: 5,
  W: 6,
  X: 7,
  Y: 8,
  Z: 9,
};

const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

export type VehicleIdentifierType = 'empty' | 'vin' | 'hin' | 'serial';

function looksLikeVin(vinInput: string): boolean {
  const vin = (vinInput || '').trim().toUpperCase();
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(vin);
}

export function hasValidHinFormat(hinInput: string): boolean {
  const hin = (hinInput || '').trim().toUpperCase();
  return /^[A-HJ-NPR-Z]{3}[A-HJ-NPR-Z0-9]{9}$/.test(hin);
}

export function detectVehicleIdentifierType(
  identifierInput: string,
  vehicleTypeInput?: string
): VehicleIdentifierType {
  const identifier = (identifierInput || '').trim().toUpperCase();
  const vehicleType = (vehicleTypeInput || '').trim().toLowerCase();

  if (!identifier) {
    return 'empty';
  }

  if (looksLikeVin(identifier)) {
    return 'vin';
  }

  if (hasValidHinFormat(identifier)) {
    return 'hin';
  }

  if (vehicleType.includes('boat') && identifier.length === 12) {
    return 'hin';
  }

  return 'serial';
}

export function hasValidVinChecksum(vinInput: string): boolean {
  const vin = (vinInput || '').trim().toUpperCase();

  if (!looksLikeVin(vin)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < vin.length; i += 1) {
    const char = vin[i];
    const numericValue = Number.isFinite(Number(char))
      ? Number(char)
      : VIN_TRANSLITERATION[char];

    if (numericValue === undefined) {
      return false;
    }

    sum += numericValue * VIN_WEIGHTS[i];
  }

  const remainder = sum % 11;
  const expectedCheckDigit = remainder === 10 ? 'X' : String(remainder);
  return vin[8] === expectedCheckDigit;
}

export function getVinLookupValidationError(vinInput: string): string | null {
  const vin = (vinInput || '').trim().toUpperCase();

  if (!looksLikeVin(vin)) {
    return 'VIN lookup requires a valid 17-character VIN.';
  }

  if (!hasValidVinChecksum(vin)) {
    return 'VIN lookup requires a valid 17-character VIN with a correct check digit.';
  }

  return null;
}
