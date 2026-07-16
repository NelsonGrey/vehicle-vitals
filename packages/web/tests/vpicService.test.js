import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearCache,
  fetchAllMakes,
  fetchModelsForMakeYear,
  getYearOptions,
} from '../src/utils/vpicService';

describe('vpicService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Set time to ensure cache is always expired
    vi.setSystemTime(new Date('2024-01-01'));
    // Clear any cached data from previous tests
    clearCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getYearOptions', () => {
    it('returns years from current year down to start year', () => {
      const currentYear = new Date().getFullYear();
      const startYear = 1980;
      const years = getYearOptions(startYear);

      expect(years).toHaveLength(currentYear - startYear + 1);
      expect(years[0]).toBe(String(currentYear));
      expect(years[years.length - 1]).toBe(String(startYear));
    });

    it('returns years as strings', () => {
      const years = getYearOptions(2020);
      expect(years).toEqual(expect.arrayContaining(years.map(String)));
      expect(typeof years[0]).toBe('string');
    });

    it('uses default start year of 1980', () => {
      const currentYear = new Date().getFullYear();
      const years = getYearOptions();
      expect(years[years.length - 1]).toBe('1980');
      expect(years).toHaveLength(currentYear - 1980 + 1);
    });
  });

  describe('fetchAllMakes', () => {
    it('fetches makes from VPIC API and caches result', async () => {
      // Mock fetch for this test
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            Results: [
              { Make_Name: 'Toyota' },
              { Make_Name: 'Honda' },
              { Make_Name: 'Ford' },
              { Make_Name: '' }, // Should be filtered out
              { Make_Name: '  BMW  ' }, // Should be trimmed
            ],
          }),
      });

      const result = await fetchAllMakes();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://vpic.nhtsa.dot.gov/api/vehicles/GetAllMakes?format=json'
      );
      expect(result).toEqual(['BMW', 'Ford', 'Honda', 'Toyota']); // Sorted alphabetically
    });

    it('throws error when API request fails', async () => {
      // Mock fetch for this test
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
      });

      await expect(fetchAllMakes()).rejects.toThrow('Failed to load makes');
    });

    it('handles empty results', async () => {
      // Mock fetch for this test
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ Results: [] }),
      });

      const result = await fetchAllMakes();
      expect(result).toEqual([]);
    });

    it('handles malformed API response', async () => {
      // Mock fetch for this test
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const result = await fetchAllMakes();
      expect(result).toEqual([]);
    });
  });

  describe('fetchModelsForMakeYear', () => {
    it('fetches models for specific make and year', async () => {
      // Mock fetch for this test
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            Results: [
              { Model_Name: 'Camry' },
              { Model_Name: 'Corolla' },
              { Model_Name: 'Camry' }, // Duplicate should be removed
              { Model_Name: '' }, // Should be filtered out
              { Model_Name: '  Prius  ' }, // Should be trimmed
            ],
          }),
      });

      const result = await fetchModelsForMakeYear('Toyota', 2023);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/Toyota/modelyear/2023?format=json'
      );
      expect(result).toEqual(['Camry', 'Corolla', 'Prius']); // Sorted, deduplicated
    });

    it('returns empty array for empty make or year', async () => {
      const result1 = await fetchModelsForMakeYear('', 2023);
      expect(result1).toEqual([]);

      const result2 = await fetchModelsForMakeYear('Toyota', '');
      expect(result2).toEqual([]);

      const result3 = await fetchModelsForMakeYear('', '');
      expect(result3).toEqual([]);
    });

    it('normalizes make name', async () => {
      // Mock fetch for this test
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ Results: [{ Model_Name: 'Model X' }] }),
      });

      await fetchModelsForMakeYear('  tesla  ', 2023);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/tesla/modelyear/2023?format=json'
      );
    });

    it('throws error when API request fails', async () => {
      // Mock fetch for this test
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
      });

      await expect(fetchModelsForMakeYear('Toyota', 2023)).rejects.toThrow(
        'Failed to load models'
      );
    });
  });
});
