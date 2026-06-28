import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import SiteFooter from '../src/components/SiteFooter';

describe('SiteFooter', () => {
  it('renders standardized grouped footer navigation', () => {
    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <SiteFooter />
      </MemoryRouter>
    );

    const footer = screen.getByRole('contentinfo');

    expect(
      within(footer).getByRole('navigation', { name: /Product/i })
    ).toBeVisible();
    expect(
      within(footer).getByRole('navigation', { name: /Personas/i })
    ).toBeVisible();
    expect(
      within(footer).getByRole('navigation', { name: /Support and legal/i })
    ).toBeVisible();

    expect(
      within(footer).getByRole('link', { name: /How It Works/i })
    ).toHaveAttribute('href', '/start-steps');
    expect(
      within(footer).getByRole('link', { name: /Pricing/i })
    ).toHaveAttribute('href', '/subscription');
    expect(
      within(footer).getByRole('link', { name: /Light Fleets/i })
    ).toHaveAttribute('href', '/personas/light-fleets');
  });

  it('renders brand, nav, legal, and copyright sections', () => {
    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <SiteFooter />
      </MemoryRouter>
    );

    const footer = screen.getByRole('contentinfo');

    // Brand link to home
    expect(
      within(footer).getByRole('link', { name: /go to home/i })
    ).toBeInTheDocument();

    // Product nav
    expect(within(footer).getByRole('link', { name: /Help/i })).toBeVisible();
    expect(
      within(footer).getByRole('link', { name: /Product Tour/i })
    ).toBeVisible();

    // Legal nav
    expect(within(footer).getByRole('link', { name: /Terms/i })).toBeVisible();
    expect(
      within(footer).getByRole('link', { name: /Privacy/i })
    ).toBeVisible();
    expect(
      within(footer).getByRole('link', { name: /Contact/i })
    ).toBeVisible();
    expect(
      within(footer).getByRole('link', { name: /^Sales$/i })
    ).toHaveAttribute('href', 'mailto:sales@vehicle-vitals.com');

    // Copyright
    expect(within(footer).getByText(/Vehicle Vitals/)).toBeInTheDocument();
  });
});
