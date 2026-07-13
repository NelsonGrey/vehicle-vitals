import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SubscriptionPage from '../src/pages/SubscriptionPage';

const mockNavigate = vi.fn();
const mockChangeSubscriptionTier = vi.fn();
const mockCreateSubscriptionCheckoutSession = vi.fn();
const mockTrackPaymentInitiated = vi.fn();
let mockSubscription = null;
let mockTier = 'free';
let mockIsLoading = false;

vi.mock('../src/shared/useMonetization', () => ({
  useSubscription: () => ({
    subscription: mockSubscription,
    tier: mockTier,
    isLoading: mockIsLoading,
    error: null,
  }),
}));

vi.mock('../src/shared/entitlementsService', () => ({
  changeSubscriptionTier: (...args) => mockChangeSubscriptionTier(...args),
  createSubscriptionCheckoutSession: (...args) =>
    mockCreateSubscriptionCheckoutSession(...args),
}));

vi.mock('../src/shared/adAnalytics', () => ({
  trackPaymentInitiated: (...args) => mockTrackPaymentInitiated(...args),
  trackSubscriptionPageView: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('SubscriptionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('alert', vi.fn());
    mockSubscription = null;
    mockTier = 'free';
    mockIsLoading = false;
    mockChangeSubscriptionTier.mockResolvedValue({
      orgId: 'org-test',
      tier: 'pro',
      vehicleLimit: 10,
      features: {},
    });
    mockCreateSubscriptionCheckoutSession.mockResolvedValue({
      mode: 'activated',
      tier: 'pro',
      entitlements: {
        orgId: 'org-test',
        tier: 'pro',
        vehicleLimit: 10,
        features: {},
      },
    });
  });

  it('renders public pricing cards with persona-oriented plan guidance', () => {
    render(
      <MemoryRouter
        initialEntries={['/subscription']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <SubscriptionPage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', {
        name: /pricing for every kind of garage/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/^ownership records$/i)).toBeInTheDocument();
    expect(screen.getByText(/^shared garage$/i)).toBeInTheDocument();
    expect(screen.getByText(/^guided setup$/i)).toBeInTheDocument();
    expect(screen.getByText(/^hands-on maintenance$/i)).toBeInTheDocument();
    expect(screen.getByText(/^work vehicles$/i)).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Free' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pro' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Premium' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Enterprise' })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('link', { name: /contact sales/i })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/plan and coordinate/i).length).toBeGreaterThan(
      0
    );
    expect(
      screen.getAllByText(/forecast and automate/i).length
    ).toBeGreaterThan(0);
    expect(screen.getByText(/25\+ vehicles \(contract\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/contact sales/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/how to choose/i)).toBeInTheDocument();
    expect(screen.getByText(/value by tier/i)).toBeInTheDocument();
    expect(screen.getByText(/workflow value unlocked/i)).toBeInTheDocument();

    expect(screen.getByText(/feature comparison/i)).toBeInTheDocument();
    expect(screen.getAllByText('Enterprise').length).toBeGreaterThan(1);
  });

  it('calls tier change callable when selecting pro', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter
        initialEntries={['/app/subscription']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <SubscriptionPage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { name: /subscriptions and billing/i })
    ).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /choose pro/i })[0]);

    expect(mockTrackPaymentInitiated).toHaveBeenCalledWith(
      'pro',
      'monthly',
      'subscription_page'
    );
    expect(mockCreateSubscriptionCheckoutSession).toHaveBeenCalledWith(
      'pro',
      'monthly'
    );
  });

  it('shows a success banner when checkout query indicates success', () => {
    render(
      <MemoryRouter
        initialEntries={['/app/subscription?checkout=success']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <SubscriptionPage />
      </MemoryRouter>
    );

    expect(
      screen.getByText(
        /checkout completed\. your subscription is being finalized\./i
      )
    ).toBeInTheDocument();
  });

  it('shows a cancellation banner when checkout query indicates cancelled', () => {
    render(
      <MemoryRouter
        initialEntries={['/app/subscription?checkout=cancelled']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <SubscriptionPage />
      </MemoryRouter>
    );

    expect(
      screen.getByText(
        /checkout was cancelled\. no subscription change was applied\./i
      )
    ).toBeInTheDocument();
  });

  it('shows a specific recovery message for past due subscriptions', () => {
    mockSubscription = {
      tier: 'pro',
      status: 'past_due',
      currentPeriodStart: null,
      currentPeriodEnd: null,
      renewalDate: null,
      autoRenew: true,
      trialEndDate: null,
      paymentMethod: 'stripe',
      lastPaymentError: 'stripe_invoice_payment_failed',
      updatedAt: {
        toDate: () => new Date('2026-05-27T00:00:00Z'),
      },
    };
    mockTier = 'pro';

    render(
      <MemoryRouter
        initialEntries={['/app/subscription']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <SubscriptionPage />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/payment issue • update your card to restore billing/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/billing action needed/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /^support$/i })
    ).toHaveAttribute('href', '/support');
    expect(
      screen.queryByRole('link', { name: /email support/i })
    ).not.toBeInTheDocument();
  });
});
