import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SubscriptionPage from '../src/pages/SubscriptionPage';

const mockNavigate = vi.fn();

vi.mock('../src/shared/useMonetization', () => ({
  useSubscription: () => ({
    subscription: null,
    tier: 'free',
    isLoading: false,
    error: null,
  }),
}));

vi.mock('../src/shared/adAnalytics', () => ({
  trackPaymentInitiated: vi.fn(),
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
  });

  it('renders four plan cards including enterprise and contact sales CTA', () => {
    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <SubscriptionPage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { name: /plans and billing/i })
    ).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Free' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pro' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Premium' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Enterprise' })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /contact sales/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/25\+ vehicles \(contract\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/contact sales/i).length).toBeGreaterThan(0);

    expect(screen.getByText(/feature comparison/i)).toBeInTheDocument();
    expect(screen.getAllByText('Enterprise').length).toBeGreaterThan(1);
  });
});
