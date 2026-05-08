import { describe, expect, it } from 'vitest';
import {
  formatLicensePlate,
  getPlateFormatHint,
  isPlateEmpty,
  normalizeLicensePlate,
  validateLicensePlate,
} from '../licensePlateUtils';

describe('licensePlateUtils', () => {
  describe('normalizeLicensePlate', () => {
    it('should return empty string for undefined input', () => {
      expect(normalizeLicensePlate(undefined)).toBe('');
    });

    it('should return empty string for null input', () => {
      expect(normalizeLicensePlate(null as any)).toBe('');
    });

    it('should convert to uppercase', () => {
      expect(normalizeLicensePlate('abc123')).toBe('ABC123');
    });

    it('should trim whitespace', () => {
      expect(normalizeLicensePlate('  ABC123  ')).toBe('ABC123');
    });

    it('should collapse multiple spaces to single space', () => {
      expect(normalizeLicensePlate('ABC   123')).toBe('ABC 123');
    });

    it('should enforce max length of 10 characters', () => {
      expect(normalizeLicensePlate('ABCDEFGHIJK')).toBe('ABCDEFGHIJ');
    });

    it('should handle all transformations together', () => {
      expect(normalizeLicensePlate('  abc   123  ')).toBe('ABC 123');
    });
  });

  describe('formatLicensePlate', () => {
    it('should return empty string for undefined input', () => {
      expect(formatLicensePlate(undefined)).toBe('');
    });

    it('should uppercase and normalize', () => {
      expect(formatLicensePlate('abc123')).toBe('ABC123');
    });

    it('should format Canadian plates with space', () => {
      expect(formatLicensePlate('ABC1234', 'CA')).toBe('ABC 1234');
    });

    it('should not double-space already formatted plates', () => {
      expect(formatLicensePlate('ABC 1234')).toBe('ABC 1234');
    });
  });

  describe('validateLicensePlate', () => {
    it('should return valid for empty plate (optional field)', () => {
      const result = validateLicensePlate('');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return valid for undefined (optional field)', () => {
      const result = validateLicensePlate(undefined);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid US-style plates', () => {
      const validPlates = ['ABC123', 'AB1234', 'A1234', 'ABC1234'];
      validPlates.forEach(plate => {
        const result = validateLicensePlate(plate);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject plates over max length', () => {
      const result = validateLicensePlate('ABCDEFGHIJK');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Too long');
    });

    it('should reject plates with invalid characters', () => {
      const result = validateLicensePlate('ABC!@#');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should accept hyphens in US plates', () => {
      const result = validateLicensePlate('ABC-1234');
      expect(result.isValid).toBe(true);
    });

    it('should accept plates with spaces for Canadian format', () => {
      const result = validateLicensePlate('ABC 1234', 'CA');
      expect(result.isValid).toBe(true);
    });
  });

  describe('isPlateEmpty', () => {
    it('should return true for undefined', () => {
      expect(isPlateEmpty(undefined)).toBe(true);
    });

    it('should return true for empty string', () => {
      expect(isPlateEmpty('')).toBe(true);
    });

    it('should return true for whitespace-only string', () => {
      expect(isPlateEmpty('   ')).toBe(true);
    });

    it('should return false for non-empty plate', () => {
      expect(isPlateEmpty('ABC123')).toBe(false);
    });
  });

  describe('getPlateFormatHint', () => {
    it('should return a string hint', () => {
      const hint = getPlateFormatHint();
      expect(typeof hint).toBe('string');
      expect(hint.length).toBeGreaterThan(0);
    });

    it('should include an example format', () => {
      const hint = getPlateFormatHint();
      expect(hint).toMatch(/[A-Z]{3}\d{4}|[A-Z]{2}\d{4}/);
    });

    it('should include pattern info', () => {
      const hint = getPlateFormatHint();
      expect(hint.toLowerCase()).toMatch(/letter|number|character/);
    });
  });
});
