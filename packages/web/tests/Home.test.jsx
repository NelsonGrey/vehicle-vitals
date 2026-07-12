import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Home from '../src/pages/Home';
import {
  getMaintenanceEntries,
  getVehicles,
} from '../src/shared/firestoreService';
import { getHouseholdGarageStatus } from '../src/utils/householdGarageService';
import { getMaintenancePlan } from '../src/utils/vehicleService';

vi.mock('../src/shared/firestoreService', () => ({
  getVehicles: vi.fn(),
  getMaintenanceEntries: vi.fn(),
  deleteVehicle: vi.fn(),
  updateVehicle: vi.fn(),
}));

vi.mock('../src/utils/vehicleService', () => ({
  getVehicleInsights: vi.fn(),
  buildPersistedVinInsights: vi.fn(),
  getMaintenancePlan: vi.fn(() =>
    Promise.resolve({
      strategy: 'static_schedule_v1',
      modelSpecific: true,
      items: [],
    })
  ),
}));

vi.mock('../src/utils/householdGarageService', () => ({
  getHouseholdGarageStatus: vi.fn(),
}));

vi.mock('@vehicle-vitals/shared', () => ({
  computeVehicleHealthSnapshot: vi.fn(() => ({
    overallHealthScore: 74,
    overallConfidenceBand: 'medium',
    nextLikelyService: 'Oil',
    estimatedMilesPerMonth: 900,
    estimatedSpend90dLow: 120,
    estimatedSpend90dHigh: 260,
    estimatedSpend12mLow: 240,
    estimatedSpend12mHigh: 520,
    estimatedSpend36mLow: 800,
    estimatedSpend36mHigh: 1600,
    accuracyTip:
      'Keep mileage and service entries current so remaining-life estimates stay accurate.',
    components: [
      {
        componentId: 'oil_change',
        label: 'Oil',
        status: 'service_soon',
        remainingLifePercent: 0.2,
        remainingMiles: 800,
        confidenceBand: 'high',
        estimatedCostLow: 70,
        estimatedCostHigh: 140,
      },
      {
        componentId: 'tire_rotation',
        label: 'Rotation',
        status: 'watch',
        remainingLifePercent: 0.4,
        remainingMiles: 2400,
        confidenceBand: 'medium',
        estimatedCostLow: 25,
        estimatedCostHigh: 60,
      },
      {
        componentId: 'brake_service',
        label: 'Brakes',
        status: 'good',
        remainingLifePercent: 0.75,
        remainingMiles: 12000,
        confidenceBand: 'low',
        estimatedCostLow: 300,
        estimatedCostHigh: 900,
      },
      {
        componentId: 'battery_replacement',
        label: 'Battery',
        status: 'watch',
        remainingLifePercent: 0.35,
        remainingMiles: 5000,
        confidenceBand: 'low',
        estimatedCostLow: 160,
        estimatedCostHigh: 320,
      },
    ],
  })),
}));

vi.mock('../src/shared/useMonetization', () => ({
  useSubscription: () => ({ tier: 'free' }),
  useFeatureFlag: vi.fn(() => false),
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

// Mirrors getMaintenancePlanCallable's response shape. Home.tsx derives
// milesUntilDue itself (nextDueMileage - vehicle.mileage) and formats the
// description from serviceType, so tests configure nextDueMileage relative
// to TOYOTA's 30000 mileage rather than milesUntilDue directly.
function mockPlan(items) {
  return Promise.resolve({
    strategy: 'static_schedule_v1',
    modelSpecific: true,
    items,
  });
}

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
    getMaintenanceEntries.mockResolvedValue([]);
    getMaintenancePlan.mockReturnValue(mockPlan([]));
  });

  afterEach(() => {
    cleanup();
  });

  it('shows no maintenance badge when the maintenance plan has no items', async () => {
    getMaintenancePlan.mockReturnValue(mockPlan([]));
    renderHome();
    await waitFor(() => screen.getAllByText('2022 Toyota Camry'));
    expect(screen.queryByText(/maintenance due/i)).toBeNull();
    expect(screen.queryByText(/service due soon/i)).toBeNull();
  });

  it('shows no badge when all items are beyond 5000 miles away', async () => {
    getMaintenancePlan.mockReturnValue(
      mockPlan([
        {
          serviceType: 'oil_change',
          intervalMiles: 5000,
          intervalMonths: 6,
          nextDueMileage: 38000,
          nextDueDate: '2026-12-01',
        },
      ])
    );
    renderHome();
    await waitFor(() => screen.getAllByText('2022 Toyota Camry'));
    expect(screen.queryByText(/maintenance due/i)).toBeNull();
    expect(screen.queryByText(/service due soon/i)).toBeNull();
  });

  it('shows "Service due soon" badge when closest item is in 1001–5000 miles', async () => {
    getMaintenancePlan.mockReturnValue(
      mockPlan([
        {
          serviceType: 'tire_rotation',
          intervalMiles: 5000,
          intervalMonths: 6,
          nextDueMileage: 32500,
          nextDueDate: '2026-09-01',
        },
      ])
    );
    renderHome();
    await waitFor(() => screen.getByText(/service due soon/i));
    expect(screen.getByText(/service due soon/i)).toBeInTheDocument();
  });

  it('shows "Maintenance due!" badge when closest item is ≤1000 miles away', async () => {
    getMaintenancePlan.mockReturnValue(
      mockPlan([
        {
          serviceType: 'oil_change',
          intervalMiles: 5000,
          intervalMonths: 6,
          nextDueMileage: 30500,
          nextDueDate: '2026-08-01',
        },
      ])
    );
    renderHome();
    await waitFor(() => screen.getByText(/maintenance due/i));
    expect(screen.getByText(/maintenance due/i)).toBeInTheDocument();
  });

  it('"Maintenance due!" takes priority over "Service due soon" when mixed', async () => {
    getMaintenancePlan.mockReturnValue(
      mockPlan([
        {
          serviceType: 'oil_change',
          intervalMiles: 5000,
          intervalMonths: 6,
          nextDueMileage: 30400,
          nextDueDate: '2026-08-01',
        },
        {
          serviceType: 'tire_rotation',
          intervalMiles: 5000,
          intervalMonths: 6,
          nextDueMileage: 33000,
          nextDueDate: '2026-09-01',
        },
      ])
    );
    renderHome();
    await waitFor(() => screen.getByText(/maintenance due/i));
    expect(screen.getByText(/maintenance due/i)).toBeInTheDocument();
    expect(screen.queryByText(/service due soon/i)).toBeNull();
  });

  it('detail panel shows "Upcoming Maintenance" section with item descriptions', async () => {
    getMaintenancePlan.mockReturnValue(
      mockPlan([
        {
          serviceType: 'oil_change',
          intervalMiles: 5000,
          intervalMonths: 6,
          nextDueMileage: 30800,
          nextDueDate: '2026-08-01',
        },
        {
          serviceType: 'tire_rotation',
          intervalMiles: 5000,
          intervalMonths: 6,
          nextDueMileage: 32500,
          nextDueDate: '2026-09-01',
        },
      ])
    );
    renderHome();
    await waitFor(() => screen.getByText('Upcoming Maintenance'));
    expect(screen.getByText('Oil Change')).toBeInTheDocument();
    expect(screen.getByText('Tire Rotation')).toBeInTheDocument();
  });

  it('detail panel shows mileage remaining for each maintenance item', async () => {
    getMaintenancePlan.mockReturnValue(
      mockPlan([
        {
          serviceType: 'oil_change',
          intervalMiles: 5000,
          intervalMonths: 6,
          nextDueMileage: 30800,
          nextDueDate: '2026-08-01',
        },
      ])
    );
    renderHome();
    await waitFor(() => expect(screen.getAllByText('800 mi').length).toBeGreaterThan(0));
    expect(screen.getAllByText('800 mi').length).toBeGreaterThan(0);
  });

  it('detail panel shows "Due now" for an overdue item (milesUntilDue ≤ 0)', async () => {
    getMaintenancePlan.mockReturnValue(
      mockPlan([
        {
          serviceType: 'oil_change',
          intervalMiles: 5000,
          intervalMonths: 6,
          nextDueMileage: 30000,
          nextDueDate: '2026-07-01',
        },
      ])
    );
    renderHome();
    await waitFor(() => screen.getByText('Due now'));
    expect(screen.getByText('Due now')).toBeInTheDocument();
  });

  it('detail panel has a "View all →" link to /app/upcoming', async () => {
    getMaintenancePlan.mockReturnValue(
      mockPlan([
        {
          serviceType: 'oil_change',
          intervalMiles: 5000,
          intervalMonths: 6,
          nextDueMileage: 30600,
          nextDueDate: '2026-08-01',
        },
      ])
    );
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

  it('renders vehicle health messaging that encourages current records', async () => {
    renderHome();
    await waitFor(() => screen.getByText(/remaining-life forecast/i));

    expect(screen.getByText(/Health Score/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Keep mileage and service entries current/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Unlock the full vehicle health forecast/i)
    ).toBeInTheDocument();
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

describe('Home – zero-vehicle onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getVehicles.mockResolvedValue({ data: [], lastDoc: null, hasMore: false });
    getMaintenanceEntries.mockResolvedValue([]);
    getMaintenancePlan.mockReturnValue(mockPlan([]));
  });

  afterEach(() => {
    cleanup();
  });

  it('shows the 3-step onboarding guide when the garage is empty', async () => {
    renderHome();

    await waitFor(() => screen.getByText('No vehicles yet'));

    expect(
      screen.getByText(/Add a vehicle.*Track service and costs.*Stay on/i)
    ).toBeInTheDocument();
    const addVehicleLinks = screen.getAllByRole('link', {
      name: /add your first vehicle/i,
    });
    expect(
      addVehicleLinks.some(link => link.getAttribute('href') === '/app/add-vehicle')
    ).toBe(true);
    expect(
      screen.getByText(/log your first service record/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/unlocks once you've added a vehicle/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /review upcoming maintenance/i })
    ).toHaveAttribute('href', '/app/upcoming');
  });

  it('does not show the onboarding guide once vehicles exist', async () => {
    getVehicles.mockResolvedValue({
      data: [TOYOTA],
      lastDoc: null,
      hasMore: false,
    });

    renderHome();

    await waitFor(() => screen.getByText('Vehicles'));

    expect(screen.queryByText('No vehicles yet')).not.toBeInTheDocument();
  });
});

describe('Home – household garage badge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getVehicles.mockResolvedValue({
      data: [TOYOTA],
      lastDoc: null,
      hasMore: false,
    });
    getMaintenanceEntries.mockResolvedValue([]);
    getMaintenancePlan.mockReturnValue(mockPlan([]));
  });

  afterEach(() => {
    cleanup();
  });

  it('shows a household badge when the garage is a shared household', async () => {
    getHouseholdGarageStatus.mockResolvedValue({
      success: true,
      orgId: 'org-1',
      orgType: 'household',
      garageStorageMode: 'dual_write',
      name: 'The Nelson Household',
    });

    renderHome();

    await waitFor(() =>
      screen.getByText(/The Nelson Household — shared household garage/i)
    );
  });

  it('does not show a household badge for a personal garage', async () => {
    getHouseholdGarageStatus.mockResolvedValue({
      success: true,
      orgId: 'org-1',
      orgType: 'personal',
      garageStorageMode: 'user_scoped',
    });

    renderHome();

    await waitFor(() => screen.getAllByText('2022 Toyota Camry'));
    expect(
      screen.queryByText(/shared household garage/i)
    ).not.toBeInTheDocument();
  });
});
