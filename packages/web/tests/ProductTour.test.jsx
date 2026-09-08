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
  it('renders a task-based tour', () => {
    renderProductTour();

    expect(
      screen.getByRole('heading', { name: /^Product Tour$/i })
    ).toBeInTheDocument();
  });

  it('renders the task-based workflow steps', () => {
    renderProductTour();

    expect(
      screen.getByRole('heading', { name: /1\. Add a vehicle/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /2\. Save service proof/i })
    ).toBeInTheDocument();
  });

  it('renders the demo video panels for each workflow, backed by verified assets', () => {
    const { container } = renderProductTour();

    expect(
      screen.getByRole('heading', { name: /^Getting started video$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /^Service tracking video$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /^Web and mobile video$/i })
    ).toBeInTheDocument();
    // All three demo panels are YouTube facades now (play buttons; the
    // youtube-nocookie iframe only mounts on click). No self-hosted <video>.
    expect(container.querySelectorAll('video')).toHaveLength(0);
    expect(
      screen.getByRole('button', { name: /^Play Getting started video$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^Play Service tracking video$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^Play Web and mobile video$/i })
    ).toBeInTheDocument();
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
