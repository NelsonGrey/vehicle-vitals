import { describe, expect, it, vi } from 'vitest';
import {
  getDaysUntilRenewal,
  getSubscriptionStatusDisplay,
  getSubscriptionSummary,
  getTierBadge,
  isInTrial,
  isSubscriptionActive,
  isSubscriptionExpired,
  type SubscriptionData,
} from '../subscriptionService';

function ts(date: Date) {
  return { toDate: () => date } as any;
}

function makeSub(overrides: Partial<SubscriptionData> = {}): SubscriptionData {
  return {
    tier: 'pro',
    status: 'active',
    currentPeriodStart: null,
    currentPeriodEnd: null,
    renewalDate: ts(new Date('2026-06-01T00:00:00Z')),
    autoRenew: true,
    trialEndDate: null,
    paymentMethod: 'stripe',
    lastPaymentError: null,
    updatedAt: ts(new Date('2026-05-01T00:00:00Z')),
    ...overrides,
  };
}

describe('subscriptionService helpers', () => {
  it('treats free tier as active and never expired', () => {
    const free = makeSub({ tier: 'free', renewalDate: null });
    expect(isSubscriptionActive(free)).toBe(true);
    expect(isSubscriptionExpired(free)).toBe(false);
  });

  it('recognizes active paid subscriptions and days to renewal', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-20T00:00:00Z'));

    const sub = makeSub({ renewalDate: ts(new Date('2026-05-25T00:00:00Z')) });
    expect(isSubscriptionActive(sub)).toBe(true);
    expect(getDaysUntilRenewal(sub)).toBe(5);

    vi.useRealTimers();
  });

  it('recognizes expired subscriptions', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-20T00:00:00Z'));

    const expired = makeSub({
      renewalDate: ts(new Date('2026-05-10T00:00:00Z')),
      status: 'expired',
    });

    expect(isSubscriptionActive(expired)).toBe(false);
    expect(isSubscriptionExpired(expired)).toBe(true);

    vi.useRealTimers();
  });

  it('handles trial state and display', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-20T00:00:00Z'));

    const trial = makeSub({
      status: 'trialing',
      trialEndDate: ts(new Date('2026-05-23T00:00:00Z')),
    });

    expect(isInTrial(trial)).toBe(true);
    expect(getSubscriptionStatusDisplay(trial)).toContain('trial');

    vi.useRealTimers();
  });

  it('builds a summary and upgrade/downgrade capabilities', () => {
    const proSummary = getSubscriptionSummary(makeSub({ tier: 'pro' }));
    expect(proSummary.canUpgrade).toBe(true);
    expect(proSummary.canDowngrade).toBe(true);

    const premiumSummary = getSubscriptionSummary(makeSub({ tier: 'premium' }));
    expect(premiumSummary.canUpgrade).toBe(false);
    expect(premiumSummary.canDowngrade).toBe(true);

    const freeSummary = getSubscriptionSummary(
      makeSub({ tier: 'free', renewalDate: null })
    );
    expect(freeSummary.canDowngrade).toBe(false);
  });

  it('shows a specific payment recovery message for past due subscriptions', () => {
    expect(
      getSubscriptionStatusDisplay(
        makeSub({
          status: 'past_due',
          lastPaymentError: 'stripe_invoice_payment_failed',
        })
      )
    ).toContain('Update your card');

    expect(
      getSubscriptionStatusDisplay(
        makeSub({
          status: 'past_due',
          lastPaymentError: 'stripe_charge_disputed',
        })
      )
    ).toContain('Payment Dispute');

    expect(
      getSubscriptionStatusDisplay(
        makeSub({
          status: 'past_due',
          lastPaymentError: 'stripe_charge_refunded',
        })
      )
    ).toContain('Payment Reversed');
  });

  it('returns stable tier badge values', () => {
    expect(getTierBadge('free').name).toBe('Free');
    expect(getTierBadge('pro').badge).toBe('⭐');
    expect(getTierBadge('premium').name).toBe('Premium');
  });
});
