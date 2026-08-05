import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Coverage from '../src/pages/Coverage';
import { getVehicle } from '../src/shared/firestoreService';
import { getOwnerManuals, getWarrantySummary } from '../src/utils/vehicleService';

vi.mock('../src/shared/firestoreService', () => ({
  getVehicle: vi.fn(),
}));

vi.mock('../src/utils/vehicleService', () => ({
  getWarrantySummary: vi.fn(),
  getOwnerManuals: vi.fn(),
}));

const VEHICLE = {
  vin: 'VIN001',
  year: '2022',
  make: 'Toyota',
  model: 'Camry',
  mileage: 12000,
};

const BRAND_SPECIFIC_WARRANTY = {
  status: 'active',
  asOf: '2026-07-25',
  brandSpecific: true,
  notes:
    "Reflects standard published new-vehicle limited warranty terms for the U.S. market. Certified pre-owned coverage, extended service contracts, and state lemon-law rules can all extend beyond what's shown here.",
  coverages: [
    {
      type: 'basic',
      startDate: '2022-01-01',
      endDate: '2025-01-01',
      maxMileage: 36000,
      remainingMileage: 24000,
    },
    {
      type: 'powertrain',
      startDate: '2022-01-01',
      endDate: '2027-01-01',
      maxMileage: 60000,
      remainingMileage: 48000,
    },
    {
      type: 'corrosion',
      startDate: '2022-01-01',
      endDate: '2027-01-01',
      maxMileage: null,
      remainingMileage: null,
    },
  ],
};

const MANUALS = [
  {
    id: 'VIN001-owner-manual-portal',
    title: '2022 Toyota Camry Owner Manual Portal',
    url: 'https://www.toyota.com/owners/warranty-owners-manuals/',
  },
];

function renderCoverage() {
  return render(
    <MemoryRouter
      initialEntries={['/app/coverage/VIN001']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/app/coverage/:vin" element={<Coverage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Coverage page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getVehicle.mockResolvedValue(VEHICLE);
    getWarrantySummary.mockResolvedValue(BRAND_SPECIFIC_WARRANTY);
    getOwnerManuals.mockResolvedValue(MANUALS);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders brand-specific warranty coverage without the generic-estimate caveat', async () => {
    renderCoverage();

    await waitFor(() =>
      expect(screen.getByText('Warranty Coverage')).toBeTruthy()
    );

    expect(screen.getByText('Active')).toBeTruthy();
    expect(screen.getByText('Basic')).toBeTruthy();
    expect(screen.getByText('Powertrain')).toBeTruthy();
    expect(screen.getByText('Corrosion')).toBeTruthy();
    expect(screen.getByText('Unlimited miles')).toBeTruthy();
    expect(
      screen.queryByText(/no manufacturer data on file/i)
    ).toBeNull();
  });

  it('shows the generic-estimate caveat when the make is not brandSpecific', async () => {
    getWarrantySummary.mockResolvedValue({
      ...BRAND_SPECIFIC_WARRANTY,
      brandSpecific: false,
    });

    renderCoverage();

    await waitFor(() =>
      expect(
        screen.getByText(/no manufacturer data on file/i)
      ).toBeTruthy()
    );
  });

  it('renders the owner manual portal link', async () => {
    renderCoverage();

    await waitFor(() =>
      expect(
        screen.getByText(/2022 Toyota Camry Owner Manual Portal/)
      ).toBeTruthy()
    );

    const link = screen.getByRole('link', {
      name: /2022 Toyota Camry Owner Manual Portal/,
    });
    expect(link.getAttribute('href')).toBe(
      'https://www.toyota.com/owners/warranty-owners-manuals/'
    );
  });

  it('shows an error message when the vehicle is not found', async () => {
    getVehicle.mockResolvedValue(null);

    renderCoverage();

    await waitFor(() =>
      expect(screen.getByText('Vehicle not found.')).toBeTruthy()
    );
  });
});
