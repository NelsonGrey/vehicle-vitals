import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import ProductTour from '../src/pages/ProductTour';

function renderProductTour() {
  return render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <ProductTour />
    </MemoryRouter>
  );
}

describe('ProductTour page (canonical Product Tour, /product-tour)', () => {
  it('renders a task-based tour without unverified video placeholders', () => {
    const { container } = renderProductTour();

    expect(
      screen.getByRole('heading', { name: /^Product Tour$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /1\. Add a vehicle/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /2\. Save service proof/i })
    ).toBeInTheDocument();
    expect(container.querySelector('video')).toBeNull();
  });

  it('includes the screens merged in from the old Everyday Screens page', () => {
    renderProductTour();

    expect(
      screen.getByRole('heading', { name: /^Vehicle details$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /^Add a vehicle$/i })
    ).toBeInTheDocument();
  });

  it('organizes screens around the canonical capability model', () => {
    renderProductTour();

    expect(
      screen.getByRole('heading', { name: /^Garage$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /^Records$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /^Service history$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /^Maintenance plan$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /^Shops & services$/i })
    ).toBeInTheDocument();
  });

  it('sets the document title via PageSEO', () => {
    renderProductTour();

    expect(document.title).toMatch(/Product Tour/i);
  });
});
