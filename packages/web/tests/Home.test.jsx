import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getUpcomingMaintenance } from '@vehicle-vitals/shared';
import Home from '../src/pages/Home';
import { getVehicles } from '../src/shared/firestoreService';

vi.mock('../src/shared/firestoreService', () => ({
  getVehicles: vi.fn(),
  deleteVehicle: vi.fn(),
  updateVehicle: vi.fn(),
}));

vi.mock('../src/utils/vehicleService', () => ({
  getVehicleInsights: vi.fn(),
  buildPersistedVinInsights: vi.fn(),
}));

vi.mock('@vehicle-vitals/shared', () => ({
  getUpcomingMaintenance: vi.fn(() => []),
}));

const TOYOTA = {
  vin: 'VIN001',
  make: 'Toyota',
  model: 'Camry',
  year: '2022',
  mileage: '30000',
  recallsCount: 0,
  vehicleStatus: 'active',
};

function renderHome() {
  return render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Home />
    </MemoryRouter>
  );
}

describe('Home – smart maintenance alert badges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getVehicles.mockResolvedValue({
      data: [TOYOTA],
      lastDoc: null,
      hasMore: false,
    });
    getUpcomingMaintenance.mockReturnValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  it('shows no maintenance badge when getUpcomingMaintenance returns empty', async () => {
    getUpcomingMaintenance.mockReturnValue([]);
    renderHome();
    await waitFor(() => screen.getAllByText('2022 Toyota Camry'));
    expect(screen.queryByText(/maintenance due/i)).toBeNull();
    expect(screen.queryByText(/service due soon/i)).toBeNull();
  });

  it('shows no badge when all items are beyond 5000 miles away', async () => {
    getUpcomingMaintenance.mockReturnValue([
      {
        id: 'oilChange',
        description: 'Oil change',
        milesUntilDue: 8000,
        nextDueMileage: 38000,
      },
    ]);
    renderHome();
    await waitFor(() => screen.getAllByText('2022 Toyota Camry'));
    expect(screen.queryByText(/maintenance due/i)).toBeNull();
    expect(screen.queryByText(/service due soon/i)).toBeNull();
  });

  it('shows "Service due soon" badge when closest item is in 1001–5000 miles', async () => {
    getUpcomingMaintenance.mockReturnValue([
      {
        id: 'tireRotation',
        description: 'Tire rotation',
        milesUntilDue: 2500,
        nextDueMileage: 32500,
      },
    ]);
    renderHome();
    await waitFor(() => screen.getByText(/service due soon/i));
    expect(screen.getByText(/service due soon/i)).toBeInTheDocument();
  });

  it('shows "Maintenance due!" badge when closest item is ≤1000 miles away', async () => {
    getUpcomingMaintenance.mockReturnValue([
      {
        id: 'oilChange',
        description: 'Oil and filter change',
        milesUntilDue: 500,
        nextDueMileage: 30500,
      },
    ]);
    renderHome();
    await waitFor(() => screen.getByText(/maintenance due/i));
    expect(screen.getByText(/maintenance due/i)).toBeInTheDocument();
  });

  it('"Maintenance due!" takes priority over "Service due soon" when mixed', async () => {
    getUpcomingMaintenance.mockReturnValue([
      {
        id: 'oilChange',
        description: 'Oil and filter change',
        milesUntilDue: 400,
        nextDueMileage: 30400,
      },
      {
        id: 'tireRotation',
        description: 'Tire rotation',
        milesUntilDue: 3000,
        nextDueMileage: 33000,
      },
    ]);
    renderHome();
    await waitFor(() => screen.getByText(/maintenance due/i));
    expect(screen.getByText(/maintenance due/i)).toBeInTheDocument();
    expect(screen.queryByText(/service due soon/i)).toBeNull();
  });

  it('detail panel shows "Upcoming Maintenance" section with item descriptions', async () => {
    getUpcomingMaintenance.mockReturnValue([
      {
        id: 'oilChange',
        description: 'Oil and filter change',
        milesUntilDue: 800,
        nextDueMileage: 30800,
      },
      {
        id: 'tireRotation',
        description: 'Tire rotation',
        milesUntilDue: 2500,
        nextDueMileage: 32500,
      },
    ]);
    renderHome();
    await waitFor(() => screen.getByText('Upcoming Maintenance'));
    expect(screen.getByText('Oil and filter change')).toBeInTheDocument();
    expect(screen.getByText('Tire rotation')).toBeInTheDocument();
  });

  it('detail panel shows mileage remaining for each maintenance item', async () => {
    getUpcomingMaintenance.mockReturnValue([
      {
        id: 'oilChange',
        description: 'Oil and filter change',
        milesUntilDue: 800,
        nextDueMileage: 30800,
      },
    ]);
    renderHome();
    await waitFor(() => screen.getByText('800 mi'));
    expect(screen.getByText('800 mi')).toBeInTheDocument();
  });

  it('detail panel shows "Due now" for an overdue item (milesUntilDue ≤ 0)', async () => {
    getUpcomingMaintenance.mockReturnValue([
      {
        id: 'oilChange',
        description: 'Oil and filter change',
        milesUntilDue: 0,
        nextDueMileage: 30000,
      },
    ]);
    renderHome();
    await waitFor(() => screen.getByText('Due now'));
    expect(screen.getByText('Due now')).toBeInTheDocument();
  });

  it('detail panel has a "View all →" link to /app/upcoming', async () => {
    getUpcomingMaintenance.mockReturnValue([
      {
        id: 'oilChange',
        description: 'Oil and filter change',
        milesUntilDue: 600,
        nextDueMileage: 30600,
      },
    ]);
    renderHome();
    await waitFor(() => screen.getByText('View all →'));
    const link = screen.getByText('View all →').closest('a');
    expect(link).toHaveAttribute('href', '/app/upcoming');
  });

  it('does not render manual backfill or Bob demo seed buttons by default', async () => {
    renderHome();
    await waitFor(() => screen.getAllByText('2022 Toyota Camry'));

    expect(
      screen.queryByRole('button', { name: /Backfill VIN Data/i })
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: /Load Bob Demo Data/i })
    ).toBeNull();
  });

  it('renders active and storage sections with status summary', async () => {
    getVehicles.mockResolvedValue({
      data: [
        { ...TOYOTA, vin: 'VIN001', vehicleStatus: 'active' },
        {
          ...TOYOTA,
          vin: 'VIN002',
          make: 'Ford',
          model: 'Bronco',
          year: '2021',
          vehicleStatus: 'stored',
        },
      ],
      lastDoc: null,
      hasMore: false,
    });

    renderHome();

    await waitFor(() =>
      expect(screen.getByText(/1 active vehicle/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/1 in storage/i)).toBeInTheDocument();
    expect(screen.getByText('Active Garage')).toBeInTheDocument();
    expect(screen.getByText('Storage')).toBeInTheDocument();
    expect(screen.getByText('Stored')).toBeInTheDocument();
  });
});
