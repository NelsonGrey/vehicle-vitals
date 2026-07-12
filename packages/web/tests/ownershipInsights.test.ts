import { describe, expect, it } from 'vitest';
import { computeOwnershipInsights } from '../src/utils/ownershipInsights';

function makeMaintenanceFile(opts = {}) {
  return {
    analysis: {
      extracted: {
        documentCategory: opts.documentCategory ?? 'service invoice',
        serviceType: opts.serviceType ?? 'oil change',
        totalCost: opts.totalCost ?? 75,
        serviceDate: opts.serviceDate ?? '2024-03-15',
        mileage: opts.mileage ?? 55000,
      },
      confidence: opts.confidence ?? 0.9,
      sourceText: opts.sourceText ?? 'Oil change service performed.',
    },
  };
}

function makeFinanceFile(opts = {}) {
  return {
    analysis: {
      extracted: {
        documentCategory: opts.documentCategory ?? 'loan agreement',
        totalCost: opts.totalCost ?? 450,
        serviceDate: undefined,
        mileage: undefined,
      },
      confidence: 0.85,
      sourceText: opts.sourceText ?? 'Monthly payment $450/mo due on 1st.',
    },
  };
}

function wrapFiles(files, key = 'maintenance') {
  return [{ key, items: [{ files }] }];
}

const VEHICLE_2020 = { year: 2020 };

describe('computeOwnershipInsights', () => {
  it('returns zero counts for empty categories', () => {
    const result = computeOwnershipInsights([], VEHICLE_2020);
    expect(result.analyzedDocumentCount).toBe(0);
    expect(result.maintenanceDocsCount).toBe(0);
    expect(result.financeDocsCount).toBe(0);
    expect(result.maintenanceTotalCost).toBe(0);
    // upcomingPaymentDates is only populated when estimatedMonthlyPayment > 0
    expect(result.upcomingPaymentDates).toEqual([]);
  });

  it('counts maintenance documents and sums costs', () => {
    const files = [
      makeMaintenanceFile({ totalCost: 100, serviceDate: '2024-01-10' }),
      makeMaintenanceFile({ totalCost: 200, serviceDate: '2024-06-20' }),
    ];
    const result = computeOwnershipInsights(wrapFiles(files), VEHICLE_2020);
    expect(result.maintenanceDocsCount).toBe(2);
    expect(result.maintenanceTotalCost).toBe(300);
    expect(result.maintenanceAverageCost).toBe(150);
  });

  it('picks the most recent service date', () => {
    const files = [
      makeMaintenanceFile({ serviceDate: '2023-05-01' }),
      makeMaintenanceFile({ serviceDate: '2024-11-15' }),
      makeMaintenanceFile({ serviceDate: '2022-03-20' }),
    ];
    const result = computeOwnershipInsights(wrapFiles(files), VEHICLE_2020);
    expect(result.latestServiceDate).toBe('2024-11-15');
  });

  it('counts finance documents', () => {
    const files = [makeFinanceFile({ totalCost: 450 })];
    const result = computeOwnershipInsights(
      wrapFiles(files, 'finance'),
      VEHICLE_2020
    );
    expect(result.financeDocsCount).toBe(1);
  });

  it('ignores files without analysis.extracted', () => {
    const files = [
      { analysis: { confidence: 0.1, sourceText: '' } }, // no extracted
      makeMaintenanceFile({ totalCost: 50 }),
    ];
    const result = computeOwnershipInsights(wrapFiles(files), VEHICLE_2020);
    expect(result.analyzedDocumentCount).toBe(1);
    expect(result.maintenanceDocsCount).toBe(1);
  });

  it('handles null vehicle without throwing', () => {
    const files = [makeMaintenanceFile()];
    expect(() =>
      computeOwnershipInsights(wrapFiles(files), null)
    ).not.toThrow();
  });

  it('generates 6 upcoming payment dates when a monthly payment is detected', () => {
    // Finance file with a monthly payment phrase in sourceText
    const financeFile = makeFinanceFile({
      totalCost: 350,
      sourceText: 'Monthly payment $350/mo due on the 1st of each month.',
    });
    const result = computeOwnershipInsights(
      wrapFiles([financeFile], 'finance'),
      VEHICLE_2020
    );
    expect(result.upcomingPaymentDates).toHaveLength(6);
  });

  it('handles multiple categories and items', () => {
    const categories = [
      {
        key: 'maintenance',
        items: [{ files: [makeMaintenanceFile({ totalCost: 80 })] }],
      },
      {
        key: 'maintenance',
        items: [{ files: [makeMaintenanceFile({ totalCost: 120 })] }],
      },
      {
        key: 'finance',
        items: [{ files: [makeFinanceFile()] }],
      },
    ];
    const result = computeOwnershipInsights(categories, VEHICLE_2020);
    expect(result.analyzedDocumentCount).toBe(3);
    expect(result.maintenanceDocsCount).toBe(2);
    expect(result.financeDocsCount).toBe(1);
    expect(result.maintenanceTotalCost).toBe(200);
  });

  it('excludes a Bill of Sale filed under Ownership from maintenance spend, even though it is tagged as a generic "receipt"', () => {
    const categories = [
      {
        key: 'ownership',
        items: [
          {
            files: [
              makeMaintenanceFile({
                documentCategory: 'receipt',
                serviceType: undefined,
                totalCost: 108000,
              }),
            ],
          },
        ],
      },
      {
        key: 'maintenance',
        items: [{ files: [makeMaintenanceFile({ totalCost: 75 })] }],
      },
    ];
    const result = computeOwnershipInsights(categories, VEHICLE_2020);
    expect(result.maintenanceDocsCount).toBe(1);
    expect(result.maintenanceTotalCost).toBe(75);
  });
});
