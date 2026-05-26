import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Layout from '../src/components/Layout';

vi.mock('../src/components/SiteHeader', () => ({
  default: ({ overlay }) => (
    <header data-testid="site-header" data-overlay={overlay}>
      Header
    </header>
  ),
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

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet">Outlet Content</div>,
  };
});

describe('Layout Component', () => {
  it('renders shell sections and standalone ad breaks', () => {
    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Layout />
      </MemoryRouter>
    );

    expect(screen.getByTestId('site-header')).toBeInTheDocument();
    expect(screen.getByTestId('header-ad-bar')).toBeInTheDocument();
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
    expect(screen.getByTestId('inline-ad-section')).toBeInTheDocument();
    expect(screen.getByTestId('site-footer')).toBeInTheDocument();
    expect(
      screen.getByText(/you are viewing: product overview/i)
    ).toBeInTheDocument();
  });

  it('uses a centered 1280px shell and keeps inline ad outside main content', () => {
    const { container } = render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Layout />
      </MemoryRouter>
    );

    const appRoot = container.firstChild;
    expect(appRoot).toHaveClass('min-h-screen');

    const mainContentContainer = container.querySelector('main > div');
    expect(mainContentContainer).toBeTruthy();
    expect(mainContentContainer?.classList.contains('max-w-7xl')).toBe(true);
    expect(mainContentContainer?.classList.contains('mx-auto')).toBe(true);

    const mainEl = container.querySelector('main');
    const inlineAdEl = screen.getAllByTestId('inline-ad-section')[0];
    expect(mainEl?.contains(inlineAdEl)).toBe(false);
  });

  it('shows app workspace context cues on app routes', () => {
    render(
      <MemoryRouter
        initialEntries={['/app']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Layout />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/you are viewing: application workspace/i)
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: /help & how-to/i }).length
    ).toBeGreaterThan(0);
  });

  it('shows help context cues on help routes', () => {
    render(
      <MemoryRouter
        initialEntries={['/help']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Layout />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/you are viewing: help & how-to/i)
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: /application workspace/i }).length
    ).toBeGreaterThan(0);
  });
});
