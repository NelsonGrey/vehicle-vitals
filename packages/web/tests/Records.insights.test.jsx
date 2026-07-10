import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Records from '../src/pages/Records';
import {
  completeReminder,
  dismissReminder,
  getAttachmentAnalyses,
  getReminders,
  getVehicle,
  reopenReminder,
  snoozeReminder,
  updateVehicle,
} from '../src/shared/firestoreService';
import { computeOwnershipInsights } from '../src/utils/ownershipInsights';

vi.mock('../src/shared/firestoreService', () => ({
  addReminder: vi.fn(),
  completeReminder: vi.fn(),
  dismissReminder: vi.fn(),
  getAttachmentAnalyses: vi.fn(),
  getReminders: vi.fn(),
  getVehicle: vi.fn(),
  reopenReminder: vi.fn(),
  snoozeReminder: vi.fn(),
  updateVehicle: vi.fn(),
}));

vi.mock('../src/shared/storageService', () => ({
  deleteFile: vi.fn(),
  generateVehicleRecordAttachmentPath: vi.fn(),
  uploadFile: vi.fn(),
}));

vi.mock('../src/utils/attachmentAnalysisService', () => ({
  analyzeAttachmentText: vi.fn(),
}));

vi.mock('../src/utils/calendarService', () => ({
  createMaintenanceCalendarEvent: vi.fn(),
}));

vi.mock('../src/utils/ownershipInsights', () => ({
  computeOwnershipInsights: vi.fn(),
}));

vi.mock('@vehicle-vitals/shared', () => ({
  createStandardVehiclePortfolio: vi.fn(() => ({ categories: [] })),
}));

const VEHICLE = {
  vin: 'VIN001',
  year: '2022',
  make: 'Toyota',
  model: 'Camry',
  documentPortfolio: {
    categories: [
      {
        key: 'ownership',
        title: 'Ownership',
        items: [
          {
            id: 'loan_contract',
            title: 'Loan Contract',
            description: 'Loan agreement details',
            required: true,
            status: 'ready',
            files: [],
          },
        ],
      },
    ],
  },
};

const BASE_INSIGHTS = {
  analyzedDocumentCount: 2,
  maintenanceDocsCount: 1,
  maintenanceTotalCost: 250,
  maintenanceAverageCost: 250,
  latestServiceDate: '2026-03-01',
  financeDocsCount: 1,
  estimatedMonthlyPayment: 425.5,
  estimatedPrincipal: 20000,
  estimatedCurrentValue: 17000,
  estimatedValueRealized: 3000,
  estimatedPaidToDate: 5106,
  upcomingPaymentDates: ['6/1/2026'],
};

function renderRecords() {
  return render(
    <MemoryRouter
      initialEntries={['/app/records/VIN001']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/app/records/:vin" element={<Records />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Records scheduled insight actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getVehicle.mockResolvedValue(VEHICLE);
    getAttachmentAnalyses.mockResolvedValue([]);
    updateVehicle.mockResolvedValue(undefined);
    completeReminder.mockResolvedValue(undefined);
    dismissReminder.mockResolvedValue(undefined);
    snoozeReminder.mockResolvedValue(undefined);
    reopenReminder.mockResolvedValue(undefined);
    computeOwnershipInsights.mockReturnValue(BASE_INSIGHTS);
  });

  afterEach(() => {
    cleanup();
  });

  it('snoozes a scheduled insight reminder from Records', async () => {
    getReminders.mockResolvedValue([
      {
        id: 'r-payment',
        title: 'Monthly payment for Toyota Camry',
        serviceType: 'payment_reminder',
        status: 'active',
        nextDueDate: '2026-05-01T09:00:00.000Z',
      },
    ]);

    renderRecords();

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Ownership Insights/i })
      ).toBeInTheDocument();
    });
    fireEvent.click(
      screen.getByRole('button', { name: /Ownership Insights/i })
    );

    await waitFor(() => {
      expect(screen.getByText('Scheduled Insight Actions')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Snooze 14d' }));

    await waitFor(() => {
      expect(snoozeReminder).toHaveBeenCalledWith(
        'VIN001',
        'r-payment',
        expect.stringMatching(/T/)
      );
    });
  });

  it('resumes a snoozed reminder from Records', async () => {
    getReminders.mockResolvedValue([
      {
        id: 'r-payment',
        title: 'Monthly payment for Toyota Camry',
        serviceType: 'payment_reminder',
        status: 'snoozed',
        nextDueDate: '2026-05-01T09:00:00.000Z',
      },
    ]);

    renderRecords();

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Ownership Insights/i })
      ).toBeInTheDocument();
    });
    fireEvent.click(
      screen.getByRole('button', { name: /Ownership Insights/i })
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Resume' })
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));

    await waitFor(() => {
      expect(reopenReminder).toHaveBeenCalledWith('VIN001', 'r-payment');
    });
  });

  it('completes a scheduled reminder from Records', async () => {
    getReminders.mockResolvedValue([
      {
        id: 'r-maintenance',
        title: 'Maintenance follow-up',
        serviceType: 'maintenance_follow_up',
        status: 'active',
        nextDueDate: '2026-05-01T09:00:00.000Z',
      },
    ]);

    renderRecords();

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Ownership Insights/i })
      ).toBeInTheDocument();
    });
    fireEvent.click(
      screen.getByRole('button', { name: /Ownership Insights/i })
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Complete' })
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Complete' }));

    await waitFor(() => {
      expect(completeReminder).toHaveBeenCalledWith('VIN001', 'r-maintenance');
    });
  });

  it('dismisses a scheduled reminder from Records', async () => {
    getReminders.mockResolvedValue([
      {
        id: 'r-equity',
        title: 'Value review',
        serviceType: 'equity_review',
        status: 'active',
        nextDueDate: '2026-05-01T09:00:00.000Z',
      },
    ]);

    renderRecords();

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Ownership Insights/i })
      ).toBeInTheDocument();
    });
    fireEvent.click(
      screen.getByRole('button', { name: /Ownership Insights/i })
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Dismiss' })
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

    await waitFor(() => {
      expect(dismissReminder).toHaveBeenCalledWith('VIN001', 'r-equity');
    });
  });
});
