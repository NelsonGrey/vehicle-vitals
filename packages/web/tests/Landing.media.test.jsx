import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Landing from '../src/pages/Landing';

vi.mock('../src/components/SiteHeader', () => ({
  default: () => <header data-testid="site-header">Header</header>,
}));

vi.mock('../src/components/SiteFooter', () => ({
  default: () => <footer data-testid="site-footer">Footer</footer>,
}));

vi.mock('../src/components/HeaderAdBar', () => ({
  default: () => <div data-testid="header-ad-bar">Header Ad</div>,
}));

vi.mock('../src/components/InlineAdSection', () => ({
  default: () => <div data-testid="inline-ad-section">Inline Ad</div>,
}));

describe('Landing media surfaces', () => {
  it('leads with persona paths, plan guidance, and dedicated proof pages', () => {
    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Landing />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', {
        name: /One garage for every vehicle record, reminder, and repair cost/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /Choose the path that matches your garage/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /Plans built around growing vehicle responsibility/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Product proof for the story/i })
    ).toBeInTheDocument();

    expect(screen.getAllByText(/Ownership records/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Shared garage/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Guided setup/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Hands-on maintenance/i).length).toBeGreaterThan(
      0
    );
    expect(screen.getAllByText(/Work vehicles/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Pro is the best fit/i)).toBeInTheDocument();
    expect(screen.getByText(/Forecast and automate/i)).toBeInTheDocument();

    expect(screen.queryByText(/you are viewing:/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /Start in 3 simple steps/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /Everyday screens you will use/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /Short video tours/i })
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole('link', { name: /Compare plans/i })
    ).toHaveAttribute('href', '/subscription');
    expect(
      screen.getAllByRole('link', { name: /Read use case/i })[0]
    ).toHaveAttribute('href', '/personas/owners');
    expect(
      screen.getByRole('link', { name: /Open getting started/i })
    ).toHaveAttribute('href', '/getting-started');
    expect(
      screen.queryByRole('link', { name: /Open screens page/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Open product tour/i })
    ).toHaveAttribute('href', '/product-tour');
  });
});
