import { describe, expect, it } from 'vitest';
import {
  detectVehicleIdentifierType,
  getVinDecodeValidationError,
  hasValidHinFormat,
  hasValidVinChecksum,
} from '../src/utils/vinValidation';

describe('vinValidation', () => {
  it('accepts a VIN with valid checksum', () => {
    expect(hasValidVinChecksum('1HGCM82633A004352')).toBe(true);
    expect(getVinDecodeValidationError('1HGCM82633A004352')).toBeNull();
  });

  it('rejects VIN with invalid check digit', () => {
    expect(hasValidVinChecksum('1HGCM82633A004353')).toBe(false);
    expect(getVinDecodeValidationError('1HGCM82633A004353')).toMatch(
      /correct check digit/i
    );
  });

  it('rejects VIN values that are not 17 characters', () => {
    expect(getVinDecodeValidationError('TESTVIN123')).toMatch(
      /17-character VIN/i
    );
  });

  it('detects HIN and validates supported format', () => {
    expect(hasValidHinFormat('ABC12345A595')).toBe(true);
    expect(detectVehicleIdentifierType('ABC12345A595', 'Boat')).toBe('hin');
  });

  it('falls back to serial for non-standard identifiers', () => {
    expect(detectVehicleIdentifierType('SN-123-ABC', 'Other')).toBe('serial');
  });
});
