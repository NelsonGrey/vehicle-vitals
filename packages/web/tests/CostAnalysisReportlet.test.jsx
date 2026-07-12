import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import CostAnalysisReportlet from '../src/components/CostAnalysisReportlet';
import {
  getAttachmentAnalyses,
  getMaintenanceEntries,
} from '../src/shared/firestoreService';

vi.mock('../src/shared/firestoreService', () => ({
  getAttachmentAnalyses: vi.fn(),
  getMaintenanceEntries: vi.fn(),
}));

const VEHICLE = {
  vin: 'VIN001',
  year: '2022',
  make: 'Toyota',
  model: 'Camry',
  purchaseDate: '2024-01-01',
  documentPortfolio: {
    categories: [
      {
        key: 'ownership',
        items: [
          {
            id: 'bill_of_sale',
            files: [{ path: 'vehicles/VIN001/records/bos/receipt.pdf' }],
          },
          {
            id: 'registration',
            // Path deliberately contains "payment" — regression check that
            // classification uses the portfolio item id, not a keyword
            // guess against the file path (which would misfile this as a
            // loan payment instead of a one-time registration fee).
            files: [
              {
                path: 'vehicles/VIN001/records/registration_payment_confirmation.pdf',
              },
            ],
          },
        ],
      },
    ],
  },
};

describe('CostAnalysisReportlet cost classification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('classifies documents by portfolio item, not by file-path keywords', async () => {
    getMaintenanceEntries.mockResolvedValue([]);
    getAttachmentAnalyses.mockResolvedValue([
      {
        storagePath: 'vehicles/VIN001/records/bos/receipt.pdf',
        extracted: { documentCategory: 'receipt', totalCost: 108000 },
      },
      {
        storagePath:
          'vehicles/VIN001/records/registration_payment_confirmation.pdf',
        extracted: { documentCategory: 'receipt', totalCost: 150 },
      },
    ]);

    render(<CostAnalysisReportlet vehicle={VEHICLE} />);

    await waitFor(() => {
      expect(screen.getByText('Total Cost of Ownership')).toBeInTheDocument();
    });

    // Purchase price recognized from the bill_of_sale item.
    expect(screen.getByText('Purchase price')).toBeInTheDocument();

    // The $150 registration fee must NOT appear as "Financing" — if the old
    // path-keyword classifier misfired on "payment" in the filename, it
    // would show up multiplied by elapsed months (150 * 24 = $3,600+)
    // instead of a one-time $150 registration cost.
    expect(screen.queryByText('Financing')).not.toBeInTheDocument();
  });

  it('does not double-count a logged Maintenance entry against its own attachment analysis', async () => {
    getMaintenanceEntries.mockResolvedValue([
      {
        id: 'm1',
        title: 'Inspection',
        cost: 45,
        date: '2026-01-01',
        attachments: [
          { path: 'vehicles/VIN001/maintenance/m1/receipt.pdf' },
        ],
      },
    ]);
    getAttachmentAnalyses.mockResolvedValue([
      {
        storagePath: 'vehicles/VIN001/maintenance/m1/receipt.pdf',
        extracted: { documentCategory: 'receipt', totalCost: 45 },
      },
    ]);

    render(<CostAnalysisReportlet vehicle={VEHICLE} />);

    await waitFor(() => {
      expect(screen.getByText('Service Spend')).toBeInTheDocument();
    });

    // $45 logged once via the entry's own cost field — not doubled to $90
    // by also summing the attachment's independently-extracted totalCost.
    expect(screen.getAllByText('$45.0').length).toBeGreaterThan(0);
    expect(screen.queryByText('$90.0')).not.toBeInTheDocument();
  });
});
