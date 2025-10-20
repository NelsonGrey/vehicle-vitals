import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Layout from '../src/components/Layout';

// Mock the child components
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

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet">Outlet Content</div>,
  };
});

describe('Layout Component', () => {
  it('renders header, main content, and footer', () => {
    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Layout />
      </MemoryRouter>
    );

    expect(screen.getByTestId('site-header')).toBeInTheDocument();
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
    expect(screen.getByTestId('site-footer')).toBeInTheDocument();
  });

  it('applies correct CSS classes', () => {
    const { container } = render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Layout />
      </MemoryRouter>
    );

    const mainDiv = container.firstChild;
    expect(mainDiv).toHaveClass('min-h-screen');
    expect(mainDiv).toHaveClass('bg-slate-50');
    expect(mainDiv).toHaveClass('text-slate-900');
    expect(mainDiv).toHaveClass('dark:bg-slate-900');
    expect(mainDiv).toHaveClass('dark:text-slate-100');
  });
});
