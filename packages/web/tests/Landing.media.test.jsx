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
  it('links to dedicated preview pages instead of rendering heavy media sections inline', () => {
    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Landing />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { name: /Explore product previews/i })
    ).toBeInTheDocument();
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
      screen.getByRole('link', { name: /Open steps page/i })
    ).toHaveAttribute('href', '/start-steps');
    expect(
      screen.getByRole('link', { name: /Open screens page/i })
    ).toHaveAttribute('href', '/everyday-screens');
    expect(
      screen.getByRole('link', { name: /Open video tours/i })
    ).toHaveAttribute('href', '/short-video-tours');
  });
});
