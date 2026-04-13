import { describe, expect, it } from 'vitest';
import { computeOwnershipInsights } from '../ownershipInsights';

describe('ownershipInsights', () => {
  it('derives finance payment, principal, depreciation, and payment schedule', () => {
    const currentYear = new Date().getFullYear();
    const categories = [
      {
        items: [
          {
            files: [
              {
                analysis: {
                  extracted: {
                    documentCategory: 'loan contract',
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

  it('aggregates maintenance spend and keeps the latest service date', () => {
    const categories = [
      {
        items: [
          {
            files: [
              {
                analysis: {
                  extracted: {
                    documentCategory: 'service invoice',
                    serviceType: 'Oil change',
                    totalCost: 89.99,
                    serviceDate: '2026-01-15',
                  },
                },
              },
              {
                analysis: {
                  extracted: {
                    documentCategory: 'repair receipt',
                    serviceType: 'Brake service',
                    totalCost: 410.01,
                    serviceDate: '2026-03-01',
                  },
                },
              },
            ],
          },
        ],
      },
    ];

    const insights = computeOwnershipInsights(categories, { year: 2022 });

    expect(insights.analyzedDocumentCount).toBe(2);
    expect(insights.maintenanceDocsCount).toBe(2);
    expect(insights.maintenanceTotalCost).toBe(500);
    expect(insights.maintenanceAverageCost).toBe(250);
    expect(insights.latestServiceDate).toBe('2026-03-01');
    expect(insights.financeDocsCount).toBe(0);
  });

  it('does not fabricate finance projections without finance evidence', () => {
    const categories = [
      {
        items: [
          {
            files: [
              {
                analysis: {
                  extracted: {
                    documentCategory: 'registration',
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
