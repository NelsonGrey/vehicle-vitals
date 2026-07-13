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
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <SiteFooter />
    </MemoryRouter>
  );
}

describe('SiteFooter', () => {
  it('renders product, persona, support, and social sections when signed out', () => {
    useAuth.mockReturnValue({ user: null });
    renderFooter();

    const footer = screen.getByRole('contentinfo');

    // Product nav present when signed out, evaluation-stage content only
    expect(
      within(footer).getByRole('navigation', { name: /Product/i })
    ).toBeVisible();
    expect(
      within(footer).getByRole('link', { name: /Getting Started/i })
    ).toHaveAttribute('href', '/getting-started');
    expect(
      within(footer).getByRole('link', { name: /Product Tour/i })
    ).toHaveAttribute('href', '/product-tour');
    expect(
      within(footer).queryByRole('link', { name: /^Screens$/i })
    ).not.toBeInTheDocument();

    // Persona nav present when signed out
    expect(
      within(footer).getByRole('navigation', { name: /Personas/i })
    ).toBeVisible();

    // Support nav always present, and includes Pricing so it isn't a lone
    // one-link "Product" group once Getting Started/Product Tour drop away
    // on sign-in
    expect(
      within(footer).getByRole('navigation', { name: /Support and legal/i })
    ).toBeVisible();
    expect(
      within(footer).getByRole('link', { name: /Pricing/i })
    ).toHaveAttribute('href', '/subscription');
    expect(within(footer).getByRole('link', { name: /^Help$/i })).toBeVisible();
    expect(
      within(footer).getByRole('link', { name: /^Support$/i })
    ).toHaveAttribute('href', '/support');
    expect(
      within(footer).getByRole('link', { name: /Privacy/i })
    ).toBeVisible();
    expect(within(footer).getByRole('link', { name: /Terms/i })).toBeVisible();

    // Social links present
    expect(
      within(footer).getByRole('link', { name: /X \/ Twitter/i })
    ).toBeInTheDocument();
    expect(
      within(footer).getByRole('link', { name: /Instagram/i })
    ).toBeInTheDocument();
    expect(
      within(footer).getByRole('link', { name: /YouTube/i })
    ).toBeInTheDocument();

    // Copyright
    expect(
      within(footer).getByText(/© \d{4} Vehicle Vitals/)
    ).toBeInTheDocument();
  });

  it('shows app nav and hides persona nav when signed in', () => {
    useAuth.mockReturnValue({ user: { uid: 'test-user' } });
    renderFooter();

    const footer = screen.getByRole('contentinfo');

    // Regression: signed-in users previously saw evaluation-stage content
    // (Getting Started, Product Tour) mixed into a Product nav alongside
    // their real app-task nav, and once those two links were removed, the
    // Product nav was left with only Pricing — a lone, oddly-placed group
    // floating between the marketing and app sides. The Product nav is now
    // entirely absent once signed in; Pricing lives in Support/legal
    // instead (asserted below), and Getting Started comes from the App nav.
    expect(
      within(footer).queryByRole('navigation', { name: /Product/i })
    ).not.toBeInTheDocument();

    expect(
      within(footer).getByRole('navigation', { name: /Support and legal/i })
    ).toBeVisible();
    expect(
      within(footer).getByRole('link', { name: /Pricing/i })
    ).toHaveAttribute('href', '/subscription');

    // Persona nav absent; app nav present
    expect(
      within(footer).queryByRole('navigation', { name: /Personas/i })
    ).not.toBeInTheDocument();
    expect(
      within(footer).getByRole('navigation', { name: /App/i })
    ).toBeVisible();

    // App nav links present with correct routes
    expect(
      within(footer).getByRole('link', { name: /^Garage$/i })
    ).toHaveAttribute('href', '/app');
    expect(
      within(footer).getByRole('link', { name: /^Account$/i })
    ).toHaveAttribute('href', '/app/profile');
    expect(
      within(footer).getByRole('link', { name: /^Service History$/i })
    ).toHaveAttribute('href', '/app/timeline');
    expect(
      within(footer).getByRole('link', { name: /^Maintenance Plan$/i })
    ).toHaveAttribute('href', '/app/upcoming');
    expect(
      within(footer).getByRole('link', { name: /^Shops & Services$/i })
    ).toHaveAttribute('href', '/app/providers');

    // Getting Started is available in both the header and footer.
    expect(
      within(footer).getByRole('link', { name: /Getting Started/i })
    ).toHaveAttribute('href', '/getting-started');
  });

  it('renders brand link and does not include email contact links', () => {
    useAuth.mockReturnValue({ user: null });
    renderFooter();

    const footer = screen.getByRole('contentinfo');

    expect(
      within(footer).getByRole('link', { name: /go to home/i })
    ).toBeInTheDocument();

    // Email links removed
    expect(
      within(footer).queryByRole('link', { name: /sales/i })
    ).not.toBeInTheDocument();
    expect(footer.querySelector('a[href^="mailto:"]')).toBeNull();
  });
});
