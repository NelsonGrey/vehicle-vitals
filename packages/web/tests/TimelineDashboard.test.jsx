import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TimelineDashboard from '../src/pages/TimelineDashboard';

const mockGetVehicles = vi.fn();
const mockGetMaintenanceEntries = vi.fn();

vi.mock('../src/shared/firestoreService', () => ({
  getVehicles: (...args) => mockGetVehicles(...args),
  getMaintenanceEntries: (...args) => mockGetMaintenanceEntries(...args),
}));

vi.mock('../src/shared/fileUtils', () => ({
  formatFileDisplay: () => ({ icon: '📄' }),
}));

vi.mock('@vehicle-vitals/shared/documentAnalysisSummary', () => ({
  buildDocumentSummary: (extracted, sourceText) =>
    extracted?.serviceType || sourceText || 'No analysis summary available yet',
}));

function renderPage(initialPath = '/app/timeline') {
  return render(
    <MemoryRouter
      initialEntries={[initialPath]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/app/timeline" element={<TimelineDashboard />} />
      </Routes>
    </MemoryRouter>
  );
}

const VEHICLES = [
  {
    vin: 'VIN1',
    year: '2020',
    make: 'Toyota',
    model: 'Camry',
    licensePlate: 'ABC123',
  },
  {
    vin: 'VIN2',
    year: '2021',
    make: 'Honda',
    model: 'Civic',
    licensePlate: 'XYZ789',
  },
];

describe('TimelineDashboard page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetVehicles.mockResolvedValue(VEHICLES);
    mockGetMaintenanceEntries.mockImplementation(vin => {
      if (vin === 'VIN1') {
        return Promise.resolve([
          {
            id: 'm1',
            title: 'Oil Change',
            notes: 'Synthetic oil',
            cost: 89.99,
            date: '2024-01-10T00:00:00.000Z',
            attachments: [
              {
                name: 'invoice.pdf',
                url: 'https://example.com/invoice.pdf',
                type: 'application/pdf',
                analysis: {
                  extracted: {
                    serviceType: 'oil change',
                    totalCost: 89.99,
                    documentCategory: 'invoice',
                  },
                  confidence: 0.85,
                },
              },
            ],
          },
        ]);
      }

      return Promise.resolve([
        {
          id: 'm2',
          title: 'Brake Service',
          notes: 'Front pads',
          cost: 320,
          date: '2099-04-01T00:00:00.000Z',
          attachments: [],
        },
      ]);
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('loads and renders timeline entries with summary cards', async () => {
    renderPage();

    expect(screen.getByText(/loading timeline/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /maintenance timeline/i })
      ).toBeInTheDocument();
      expect(screen.getAllByText(/oil change/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/brake service/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/entries logged/i)).toBeInTheDocument();
    });

    expect(mockGetVehicles.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(mockGetMaintenanceEntries).toHaveBeenCalledWith('VIN1');
    expect(mockGetMaintenanceEntries).toHaveBeenCalledWith('VIN2');
  });

  it('applies time filter toggles', async () => {
    renderPage();

    await waitFor(() => screen.getByRole('button', { name: /^future$/i }));

    await userEvent.click(screen.getByRole('button', { name: /^future$/i }));
    await waitFor(() => {
      expect(screen.getAllByText(/brake service/i).length).toBeGreaterThan(0);
      expect(screen.queryAllByText(/oil change/i).length).toBe(0);
    });

    await userEvent.click(screen.getByRole('button', { name: /^past$/i }));
    await waitFor(() => {
      expect(screen.getAllByText(/oil change/i).length).toBeGreaterThan(0);
      expect(screen.queryAllByText(/brake service/i).length).toBe(0);
    });
  });

  it('supports vehicle selection clear/all controls', async () => {
    renderPage();

    await waitFor(() => screen.getByRole('button', { name: /clear/i }));

    await userEvent.click(screen.getByRole('button', { name: /clear/i }));
    await waitFor(() => {
      expect(
        screen.getByText(/no timeline entries match the current filters/i)
      ).toBeInTheDocument();
    });

    await userEvent.click(
      screen.getByRole('button', { name: /all vehicles/i })
    );
    await waitFor(() => {
      expect(screen.getAllByText(/oil change/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/brake service/i).length).toBeGreaterThan(0);
    });
  });
});
