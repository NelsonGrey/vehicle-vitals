import { describe, expect, it, vi } from 'vitest';
import {
  QuotaCache,
  formatQuotaDisplay,
  getDaysUntilQuotaReset,
  getQuotaMessage,
  getQuotaResetDateDisplay,
  getQuotaWarningLevel,
  shouldPromptUpgrade,
  type QuotaUsage,
} from '../quotaService';

function makeUsage(overrides: Partial<QuotaUsage> = {}): QuotaUsage {
  return {
    quotaType: 'aiAnalysis',
    used: 2,
    limit: 10,
    resetDate: new Date('2026-06-01T00:00:00Z'),
    tier: 'free',
    remainingInCycle: 8,
    percentageUsed: 20,
    ...overrides,
  };
}

describe('quotaService helpers', () => {
  it('returns upgrade message when feature limit is 0', () => {
    const usage = makeUsage({ limit: 0, remainingInCycle: 0 });
    expect(getQuotaMessage(usage)).toContain('Upgrade to Pro');
  });

  it('returns exceeded message when no quota remains', () => {
    const usage = makeUsage({ remainingInCycle: 0, percentageUsed: 100 });
    expect(getQuotaMessage(usage)).toContain('quota exceeded');
  });

  it('returns warning level across thresholds', () => {
    expect(getQuotaWarningLevel(makeUsage({ remainingInCycle: 0 }))).toBe(
      'exceeded'
    );
    expect(getQuotaWarningLevel(makeUsage({ percentageUsed: 91 }))).toBe(
      'critical'
    );
    expect(getQuotaWarningLevel(makeUsage({ percentageUsed: 70 }))).toBe(
      'warning'
    );
    expect(getQuotaWarningLevel(makeUsage({ percentageUsed: 10 }))).toBe('ok');
  });

  it('formats quota display values', () => {
    expect(formatQuotaDisplay(makeUsage({ used: 3, limit: 10 }))).toBe(
      '3 / 10'
    );
    expect(formatQuotaDisplay(makeUsage({ limit: 0 }))).toBe(
      'Unlimited (Premium)'
    );
    expect(formatQuotaDisplay(makeUsage({ limit: 999 }))).toBe('Unlimited');
  });

  it('returns reset date display and days remaining', () => {
    const usage = makeUsage({ resetDate: new Date('2026-05-20T00:00:00Z') });
    expect(getQuotaResetDateDisplay(usage)).toMatch(/May/);

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-18T00:00:00Z'));
    expect(getDaysUntilQuotaReset(usage)).toBe(2);
    vi.useRealTimers();
  });

  it('prompts upgrades at the right times', () => {
    expect(shouldPromptUpgrade(makeUsage({ percentageUsed: 81 }), 'free')).toBe(
      true
    );
    expect(shouldPromptUpgrade(makeUsage({ limit: 0 }), 'pro')).toBe(true);
    expect(
      shouldPromptUpgrade(makeUsage({ percentageUsed: 90 }), 'premium')
    ).toBe(false);
  });
});

describe('QuotaCache', () => {
  it('stores, retrieves, and expires cached entries', () => {
    vi.useFakeTimers();

    const cache = new QuotaCache();
    const usage = makeUsage();

    cache.set('user-1', 'aiAnalysis', usage);
    expect(cache.get('user-1', 'aiAnalysis')).toEqual(usage);

    vi.advanceTimersByTime(5 * 60 * 1000 + 1);
    expect(cache.get('user-1', 'aiAnalysis')).toBeNull();

    vi.useRealTimers();
  });

  it('clears all entries for one user', () => {
    const cache = new QuotaCache();
    const usage = makeUsage();

    cache.set('user-1', 'aiAnalysis', usage);
    cache.set('user-1', 'apiCalls', usage);
    cache.set('user-2', 'aiAnalysis', usage);

    cache.clearForUser('user-1');

    expect(cache.get('user-1', 'aiAnalysis')).toBeNull();
    expect(cache.get('user-1', 'apiCalls')).toBeNull();
    expect(cache.get('user-2', 'aiAnalysis')).toEqual(usage);
  });
});
