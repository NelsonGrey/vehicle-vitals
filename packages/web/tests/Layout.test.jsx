import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from '../src/components/Layout';

// Mock the child components
vi.mock('../src/components/SiteHeader', () => ({
  default: ({ overlay }) => <header data-testid="site-header" data-overlay={overlay}>Header</header>
}));

vi.mock('../src/components/SiteFooter', () => ({
  default: () => <footer data-testid="site-footer">Footer</footer>
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet">Outlet Content</div>
  };
});

describe('Layout Component', () => {
  it('renders header, main content, and footer', () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );

    expect(screen.getByTestId('site-header')).toBeInTheDocument();
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
    expect(screen.getByTestId('site-footer')).toBeInTheDocument();
  });

  it('passes forceOverlay prop to header', () => {
    const { container } = render(
      <MemoryRouter>
        <Layout forceOverlay={true} />
      </MemoryRouter>
    );

    const header = container.querySelector('[data-testid="site-header"]');
    expect(header).toHaveAttribute('data-overlay', 'true');
  });

  it('applies correct CSS classes', () => {
    const { container } = render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );

    const mainDiv = container.firstChild;
    expect(mainDiv).toHaveClass('min-h-screen');
    expect(mainDiv).toHaveClass('bg-cream');
    expect(mainDiv).toHaveClass('text-charcoal');
  });
});