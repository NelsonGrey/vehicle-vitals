import Papa from 'papaparse';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  exportMaintenanceAsCSV,
  exportMaintenanceAsPDF,
} from '../src/utils/dataExport';

// Mock external dependencies
const mockJsPDF = {
  setFontSize: vi.fn(),
  text: vi.fn(),
  setFont: vi.fn(),
  autoTable: vi.fn(),
  save: vi.fn(),
  addPage: vi.fn(),
  lastAutoTable: { finalY: 100 },
};

vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(() => mockJsPDF),
}));

vi.mock('jspdf-autotable', () => ({}));

vi.mock('papaparse', () => ({
  default: {
    unparse: vi.fn(),
  },
}));

// Mock DOM APIs
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
const mockClick = vi.fn();

Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  },
  writable: true,
});

Object.defineProperty(document, 'createElement', {
  value: vi.fn().mockImplementation(() => ({
    setAttribute: vi.fn(),
    click: mockClick,
    style: {},
    download: '', // Ensure download property exists
  })),
  writable: true,
});

Object.defineProperty(document, 'body', {
  value: {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
  },
  writable: true,
});

// Mock Date
const mockDate = new Date('2025-10-20T00:00:00.000Z');
const OriginalDate = global.Date;
beforeEach(() => {
  global.Date = vi.fn((...args) => {
    if (args.length === 0) {
      return new OriginalDate(mockDate);
    }
    return new OriginalDate(...args);
  });
  global.Date.now = vi.fn(() => mockDate.getTime());
  global.Date.prototype.toISOString = OriginalDate.prototype.toISOString;
  global.Date.prototype.toLocaleDateString =
    OriginalDate.prototype.toLocaleDateString;
});

afterEach(() => {
  global.Date = OriginalDate;
});

describe('dataExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('exportMaintenanceAsCSV', () => {
    it('exports maintenance entries as CSV with correct data format', () => {
      const maintenanceEntries = [
        {
          date: new Date('2024-01-10'),
          title: 'Oil Change',
          cost: 45.5,
          mileage: 15000,
          notes: 'Regular maintenance',
        },
        {
          date: new Date('2024-01-05'),
          title: 'Tire Rotation',
          cost: 25.0,
          mileage: 14500,
          notes: '',
        },
      ];

      const vehicle = {
        vin: '1HGBH41JXMN109186',
        make: 'Honda',
        model: 'Civic',
        year: 2020,
      };

      const expectedCsvData = [
        {
          Date: '1/9/2024',
          Title: 'Oil Change',
          Cost: '45.50',
          Mileage: 15000,
          Notes: 'Regular maintenance',
        },
        {
          Date: '1/4/2024',
          Title: 'Tire Rotation',
          Cost: '25.00',
          Mileage: 14500,
          Notes: '',
        },
      ];

      Papa.unparse.mockReturnValue('mock,csv,data');
      mockCreateObjectURL.mockReturnValue('blob:mock-url');

      exportMaintenanceAsCSV(maintenanceEntries, vehicle);

      expect(Papa.unparse).toHaveBeenCalledWith(expectedCsvData);
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    });

    it('handles entries with missing cost and mileage', () => {
      const maintenanceEntries = [
        {
          date: new Date('2024-01-10'),
          title: 'Brake Check',
          cost: null,
          mileage: null,
          notes: 'No issues found',
        },
      ];

      const vehicle = {
        vin: '1HGBH41JXMN109186',
        make: 'Honda',
        model: 'Civic',
        year: 2020,
      };

      const expectedCsvData = [
        {
          Date: '1/9/2024',
          Title: 'Brake Check',
          Cost: '0.00',
          Mileage: '',
          Notes: 'No issues found',
        },
      ];

      Papa.unparse.mockReturnValue('mock,csv,data');
      mockCreateObjectURL.mockReturnValue('blob:mock-url');

      exportMaintenanceAsCSV(maintenanceEntries, vehicle);

      expect(Papa.unparse).toHaveBeenCalledWith(expectedCsvData);
    });

    it('generates correct filename with VIN and date', () => {
      const maintenanceEntries = [
        {
          date: new Date('2024-01-10'),
          title: 'Oil Change',
          cost: 45.5,
          mileage: 15000,
          notes: 'Regular maintenance',
        },
      ];

      const vehicle = {
        vin: 'TESTVIN123',
        make: 'Test',
        model: 'Car',
        year: 2020,
      };

      Papa.unparse.mockReturnValue('mock,csv,data');
      mockCreateObjectURL.mockReturnValue('blob:mock-url');

      exportMaintenanceAsCSV(maintenanceEntries, vehicle);

      const linkElement = document.createElement.mock.results[0].value;
      expect(linkElement.setAttribute).toHaveBeenCalledWith(
        'download',
        'maintenance_TESTVIN123_2025-10-20.csv'
      );
    });

    it('handles empty maintenance entries array', () => {
      const maintenanceEntries = [];
      const vehicle = {
        vin: 'TESTVIN123',
        make: 'Test',
        model: 'Car',
        year: 2020,
      };

      Papa.unparse.mockReturnValue('mock,csv,data');
      mockCreateObjectURL.mockReturnValue('blob:mock-url');

      exportMaintenanceAsCSV(maintenanceEntries, vehicle);

      expect(Papa.unparse).toHaveBeenCalledWith([]);
    });

    describe('exportMaintenanceAsPDF', () => {
      it('creates PDF with vehicle info and maintenance table', () => {
        const maintenanceEntries = [
          {
            date: new Date('2024-01-10'),
            title: 'Oil Change',
            cost: 45.5,
            mileage: 15000,
            notes: 'Regular maintenance',
          },
          {
            date: new Date('2024-01-05'),
            title: 'Tire Rotation',
            cost: 25.0,
            mileage: 14500,
            notes: 'Completed successfully',
          },
        ];

        const vehicle = {
          vin: '1HGBH41JXMN109186',
          make: 'Honda',
          model: 'Civic',
          year: 2020,
        };

        exportMaintenanceAsPDF(maintenanceEntries, vehicle);

        expect(mockJsPDF.setFontSize).toHaveBeenCalledWith(20);
        expect(mockJsPDF.text).toHaveBeenCalledWith(
          'Vehicle Maintenance History',
          20,
          20
        );
        expect(mockJsPDF.text).toHaveBeenCalledWith(
          'VIN: 1HGBH41JXMN109186',
          20,
          35
        );
        expect(mockJsPDF.text).toHaveBeenCalledWith(
          'Vehicle: Honda Civic (2020)',
          20,
          45
        );

        expect(mockJsPDF.autoTable).toHaveBeenCalledWith({
          head: [['Date', 'Title', 'Cost', 'Mileage', 'Notes']],
          body: [
            [
              '1/9/2024',
              'Oil Change',
              '$45.50',
              '15000',
              'Regular maintenance',
            ],
            [
              '1/4/2024',
              'Tire Rotation',
              '$25.00',
              '14500',
              'Completed successfully',
            ],
          ],
          startY: 55,
          styles: {
            fontSize: 8,
            cellPadding: 2,
          },
          headStyles: {
            fillColor: [59, 130, 246],
            textColor: 255,
            fontStyle: 'bold',
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245],
          },
        });

        expect(mockJsPDF.save).toHaveBeenCalledWith(
          'maintenance_1HGBH41JXMN109186_2025-10-20.pdf'
        );
      });

      it('handles entries with missing cost and mileage in PDF', () => {
        const maintenanceEntries = [
          {
            date: new Date('2024-01-10'),
            title: 'Brake Check',
            cost: null,
            mileage: null,
            notes: 'No issues found',
          },
        ];

        const vehicle = {
          vin: 'TESTVIN123',
          make: 'Test',
          model: 'Car',
          year: 2020,
        };

        exportMaintenanceAsPDF(maintenanceEntries, vehicle);

        expect(mockJsPDF.autoTable).toHaveBeenCalledWith(
          expect.objectContaining({
            body: [['1/9/2024', 'Brake Check', '$0.00', '', 'No issues found']],
          })
        );
      });

      it('handles empty maintenance entries in PDF', () => {
        const maintenanceEntries = [];
        const vehicle = {
          vin: 'TESTVIN123',
          make: 'Test',
          model: 'Car',
          year: 2020,
        };

        exportMaintenanceAsPDF(maintenanceEntries, vehicle);

        expect(mockJsPDF.autoTable).toHaveBeenCalledWith(
          expect.objectContaining({
            body: [],
          })
        );
      });
    });
  });
});
