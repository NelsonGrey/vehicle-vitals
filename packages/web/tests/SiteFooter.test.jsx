import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import SiteFooter from '../src/components/SiteFooter';

vi.mock('../src/shared/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../src/shared/marketingAnalytics', () => ({
  trackFooterNavClick: vi.fn(),
}));

import { useAuth } from '../src/shared/AuthContext';

function renderFooter() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SiteFooter />
    </MemoryRouter>
  );
}

describe('SiteFooter', () => {
  it('renders product, persona, support, and social sections when signed out', () => {
    useAuth.mockReturnValue({ user: null });
    renderFooter();

    const footer = screen.getByRole('contentinfo');

    // Product nav always present
    expect(within(footer).getByRole('navigation', { name: /Product/i })).toBeVisible();
    expect(within(footer).getByRole('link', { name: /How It Works/i })).toHaveAttribute('href', '/start-steps');
    expect(within(footer).getByRole('link', { name: /Pricing/i })).toHaveAttribute('href', '/subscription');
    expect(within(footer).getByRole('link', { name: /Product Tour/i })).toHaveAttribute('href', '/short-video-tours');
    expect(within(footer).getByRole('link', { name: /Screens/i })).toHaveAttribute('href', '/everyday-screens');

    // Persona nav present when signed out
    expect(within(footer).getByRole('navigation', { name: /Personas/i })).toBeVisible();

    // Support nav always present; Contact renamed Support
    expect(within(footer).getByRole('navigation', { name: /Support and legal/i })).toBeVisible();
    expect(within(footer).getByRole('link', { name: /^Help$/i })).toBeVisible();
    expect(within(footer).getByRole('link', { name: /^Support$/i })).toHaveAttribute('href', '/support');
    expect(within(footer).getByRole('link', { name: /Privacy/i })).toBeVisible();
    expect(within(footer).getByRole('link', { name: /Terms/i })).toBeVisible();

    // Social links present
    expect(within(footer).getByRole('link', { name: /X \/ Twitter/i })).toBeInTheDocument();
    expect(within(footer).getByRole('link', { name: /Instagram/i })).toBeInTheDocument();
    expect(within(footer).getByRole('link', { name: /YouTube/i })).toBeInTheDocument();

    // Copyright
    expect(within(footer).getByText(/© \d{4} Vehicle Vitals/)).toBeInTheDocument();
  });

  it('shows app nav and hides persona nav when signed in', () => {
    useAuth.mockReturnValue({ user: { uid: 'test-user' } });
    renderFooter();

    const footer = screen.getByRole('contentinfo');

    // Product and support still present
    expect(within(footer).getByRole('navigation', { name: /Product/i })).toBeVisible();
    expect(within(footer).getByRole('navigation', { name: /Support and legal/i })).toBeVisible();

    // Persona nav absent; app nav present
    expect(within(footer).queryByRole('navigation', { name: /Personas/i })).not.toBeInTheDocument();
    expect(within(footer).getByRole('navigation', { name: /App/i })).toBeVisible();

    // App nav links present with correct routes
    expect(within(footer).getByRole('link', { name: /^Garage$/i })).toHaveAttribute('href', '/app');
    expect(within(footer).getByRole('link', { name: /^Profile$/i })).toHaveAttribute('href', '/app/profile');
    expect(within(footer).getByRole('link', { name: /^Timeline$/i })).toHaveAttribute('href', '/app/timeline');
    expect(within(footer).getByRole('link', { name: /^Upcoming$/i })).toHaveAttribute('href', '/app/upcoming');
    expect(within(footer).getByRole('link', { name: /^Mechanics$/i })).toHaveAttribute('href', '/app/providers');

    // Getting Started must not appear (header-only nav item)
    expect(within(footer).queryByRole('link', { name: /Getting Started/i })).not.toBeInTheDocument();
  });

  it('renders brand link and does not include email contact links', () => {
    useAuth.mockReturnValue({ user: null });
    renderFooter();

    const footer = screen.getByRole('contentinfo');

    expect(within(footer).getByRole('link', { name: /go to home/i })).toBeInTheDocument();

    // Email links removed
    expect(within(footer).queryByRole('link', { name: /sales/i })).not.toBeInTheDocument();
    expect(footer.querySelector('a[href^="mailto:"]')).toBeNull();
  });
});
