import { describe, expect, it } from 'vitest';
import {
  getVinDecodeValidationError,
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
});
