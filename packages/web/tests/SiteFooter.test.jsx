import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import SiteFooter from '../src/components/SiteFooter';

describe('SiteFooter', () => {
  it('does not render Getting Started in the footer links', () => {
    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <SiteFooter />
      </MemoryRouter>
    );

    const footer = screen.getByRole('contentinfo');

    expect(
      within(footer).queryByRole('link', { name: /Getting Started/i })
    ).not.toBeInTheDocument();
    expect(
      within(footer).getByRole('link', { name: /Subscriptions/i })
    ).toBeVisible();
    expect(within(footer).getByRole('link', { name: /Help/i })).toBeVisible();
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
    expect(within(footer).getByRole('link', { name: /go to home/i })).toBeInTheDocument();

    // Main nav
    expect(within(footer).getByRole('link', { name: /Help/i })).toBeVisible();
    expect(within(footer).getByRole('link', { name: /Subscriptions/i })).toBeVisible();

    // Legal nav
    expect(within(footer).getByRole('link', { name: /Terms/i })).toBeVisible();
    expect(within(footer).getByRole('link', { name: /Privacy/i })).toBeVisible();
    expect(within(footer).getByRole('link', { name: /Contact/i })).toBeVisible();

    // Copyright
    expect(within(footer).getByText(/Vehicle Vitals/)).toBeInTheDocument();
  });
});
