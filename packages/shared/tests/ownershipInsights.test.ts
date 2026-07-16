import { describe, expect, it } from 'vitest';

import { computeOwnershipInsights } from '../src/ownershipInsights.js';

function makeMaintenanceFile(opts: Record<string, any> = {}) {
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

function makeFinanceFile(opts: Record<string, any> = {}) {
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

function wrapFiles(files: unknown[], key = 'maintenance') {
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

  it('derives finance payment, principal, depreciation, and payment schedule', () => {
    const currentYear = new Date().getFullYear();
    const categories = [
      {
        key: 'finance',
        items: [
          {
            files: [
              {
                analysis: {
                  extracted: {
                    documentCategory: 'document',
                    totalCost: 20000,
                  },
                  sourceText:
                    'Retail installment contract with lender payment of $425.50 monthly at 5.9% APR.',
                },
              },
            ],
          },
        ],
      },
    ];

    const insights = computeOwnershipInsights(categories, {
      year: currentYear - 1,
    });

    expect(insights.analyzedDocumentCount).toBe(1);
    expect(insights.financeDocsCount).toBe(1);
    expect(insights.estimatedMonthlyPayment).toBe(425.5);
    expect(insights.estimatedPrincipal).toBe(20000);
    expect(insights.estimatedCurrentValue).toBe(17000);
    expect(insights.estimatedValueRealized).toBe(3000);
    expect(insights.estimatedPaidToDate).toBe(5106);
    expect(insights.upcomingPaymentDates).toHaveLength(6);
  });

  it('uses the actual purchase date, not model year, for loan tenure on a used vehicle', () => {
    // Regression: a used vehicle's loan tenure was computed from its model
    // year, not when it was actually purchased/financed — a 10-year-old
    // model bought (and financed) 3 months ago would previously be treated
    // as having 10 years of payments behind it, overstating
    // estimatedPaidToDate up to the full loan principal (falsely showing
    // the loan as paid off).
    const currentYear = new Date().getFullYear();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const categories = [
      {
        key: 'finance',
        items: [
          {
            files: [
              {
                analysis: {
                  extracted: { documentCategory: 'document', totalCost: 20000 },
                  sourceText: 'Lender payment of $425.50 monthly due on the 1st.',
                },
              },
            ],
          },
        ],
      },
    ];

    const insights = computeOwnershipInsights(categories, {
      year: currentYear - 10,
      purchaseDate: threeMonthsAgo.toISOString().slice(0, 10),
    });

    expect(insights.estimatedPrincipal).toBe(20000);
    // 3 months of $425.50 payments, nowhere near the full principal.
    expect(insights.estimatedPaidToDate).toBeLessThan(2000);
    expect(insights.estimatedPaidToDate).not.toBe(20000);
  });

  it('does not fabricate finance projections without finance evidence', () => {
    const categories = [
      {
        key: 'ownership',
        items: [
          {
            files: [
              {
                analysis: {
                  extracted: {
                    documentCategory: 'document',
                    totalCost: 125,
                  },
                  sourceText: 'Renewal completed for annual registration.',
                },
              },
            ],
          },
        ],
      },
    ];

    const insights = computeOwnershipInsights(categories, { year: 2020 });

    expect(insights.financeDocsCount).toBe(0);
    expect(insights.estimatedMonthlyPayment).toBeUndefined();
    expect(insights.estimatedPrincipal).toBeUndefined();
    expect(insights.estimatedCurrentValue).toBeUndefined();
    expect(insights.upcomingPaymentDates).toEqual([]);
  });
});
