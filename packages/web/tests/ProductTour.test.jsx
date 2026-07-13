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
  it('renders dedicated video tour cards and expected video sources', () => {
    const { container } = renderProductTour();

    expect(
      screen.getByRole('heading', { name: /^Product Tour$/i })
    ).toBeInTheDocument();
    const expectedVideoPaths = [
      '/videos/feature-demos/onboarding-walkthrough.mp4',
      '/videos/feature-demos/maintenance-lifecycle-tour.mp4',
      '/videos/feature-demos/cross-platform-continuity.mp4',
    ];

    for (const path of expectedVideoPaths) {
      const source = container.querySelector(`video source[src="${path}"]`);
      expect(source).toBeTruthy();
    }
  });

  it('includes the screens merged in from the old Everyday Screens page', () => {
    renderProductTour();

    expect(
      screen.getByRole('heading', { name: /^Vehicle details$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /^Add vehicle screen$/i })
    ).toBeInTheDocument();
  });

  it('organizes screens around the canonical capability model', () => {
    renderProductTour();

    expect(
      screen.getByRole('heading', { name: /^Garage$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /^Service records$/i })
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
