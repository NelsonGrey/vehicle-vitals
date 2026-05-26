import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import EditVehicle from '../src/pages/EditVehicle';

const mockNavigate = vi.fn();
const mockGetVehicle = vi.fn();
const mockUpdateVehicle = vi.fn();
const mockDeleteVehicle = vi.fn();
const mockDecodeVin = vi.fn();
const mockTransferVehicle = vi.fn();
const mockFindVehiclePhotoFromWeb = vi.fn();

vi.mock('../src/hooks/useVehicleOptions', () => ({
  default: () => ({
    years: ['2019', '2020', '2021'],
    makes: ['Toyota'],
    models: ['Camry'],
    loadingMakes: false,
    loadingModels: false,
  }),
}));

vi.mock('../src/shared/firestoreService', () => ({
  addMaintenanceEntry: vi.fn(),
  deleteVehicle: (...args) => mockDeleteVehicle(...args),
  getAttachmentAnalyses: vi.fn().mockResolvedValue([]),
  getMaintenanceEntries: vi.fn().mockResolvedValue([]),
  getVehicle: (...args) => mockGetVehicle(...args),
  updateVehicle: (...args) => mockUpdateVehicle(...args),
}));

vi.mock('../src/shared/storageService', () => ({
  generateMaintenanceAttachmentPath: vi.fn(),
  uploadFile: vi.fn(),
}));

vi.mock('../src/utils/attachmentAnalysisService', () => ({
  analyzeAttachmentText: vi.fn(),
}));

vi.mock('../src/utils/calendarService', () => ({
  createMaintenanceCalendarEvent: vi.fn(),
}));

vi.mock('../src/utils/vehicleService', () => ({
  decodeVin: (...args) => mockDecodeVin(...args),
}));

vi.mock('../src/utils/vehicleTransferService', () => ({
  transferVehicle: (...args) => mockTransferVehicle(...args),
}));

vi.mock('../src/utils/vehiclePhotoService', () => ({
  findVehiclePhotoFromWeb: (...args) => mockFindVehiclePhotoFromWeb(...args),
}));

vi.mock('@vehicle-vitals/shared', () => ({
  getUpcomingMaintenance: vi.fn(() => []),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: undefined }),
    useParams: () => ({ vin: 'TESTVIN123' }),
  };
});

function renderPage() {
  return render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <EditVehicle />
    </MemoryRouter>
  );
}

const BASE_VEHICLE = {
  vin: 'TESTVIN123',
  year: '2020',
  make: 'Toyota',
  model: 'Camry',
  mileage: '45000',
  licensePlate: 'ABC123',
  purchaseDate: '2020-01-01',
  vehicleStatus: 'active',
};

describe('EditVehicle page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('alert', vi.fn());
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true)
    );
    mockGetVehicle.mockResolvedValue({ ...BASE_VEHICLE });
    mockFindVehiclePhotoFromWeb.mockResolvedValue(null);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('loads and displays vehicle details', async () => {
    renderPage();

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /edit vehicle/i })
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue('TESTVIN123')).toBeInTheDocument();
    });
  });

  it('saves changes and navigates home', async () => {
    mockUpdateVehicle.mockResolvedValue(undefined);
    renderPage();

    await waitFor(() => screen.getByRole('button', { name: /save changes/i }));
    await userEvent.clear(screen.getByLabelText(/mileage/i));
    await userEvent.type(screen.getByLabelText(/mileage/i), '50000');
    await userEvent.click(
      screen.getByRole('button', { name: /save changes/i })
    );

    await waitFor(() => {
      expect(mockUpdateVehicle).toHaveBeenCalledWith(
        'TESTVIN123',
        expect.objectContaining({ mileage: '50000', vehicleStatus: 'active' })
      );
      expect(global.alert).toHaveBeenCalledWith('Vehicle updated successfully');
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('saves storage status selection', async () => {
    mockUpdateVehicle.mockResolvedValue(undefined);
    renderPage();

    await waitFor(() => screen.getByLabelText(/location status/i));
    await userEvent.selectOptions(
      screen.getByLabelText(/location status/i),
      'stored'
    );
    await userEvent.click(
      screen.getByRole('button', { name: /save changes/i })
    );

    await waitFor(() => {
      expect(mockUpdateVehicle).toHaveBeenCalledWith(
        'TESTVIN123',
        expect.objectContaining({ vehicleStatus: 'stored' })
      );
    });
  });

  it('requires recipient email before transferring', async () => {
    renderPage();

    await waitFor(() =>
      screen.getByRole('button', { name: /^transfer vehicle$/i })
    );
    await userEvent.click(
      screen.getByRole('button', { name: /^transfer vehicle$/i })
    );

    expect(global.alert).toHaveBeenCalledWith(
      'Enter the recipient email before transferring this vehicle.'
    );
    expect(mockTransferVehicle).not.toHaveBeenCalled();
  });

  it('transfers vehicle and navigates to app', async () => {
    mockTransferVehicle.mockResolvedValue({
      success: true,
      recipientEmail: 'recipient@example.com',
    });
    renderPage();

    await waitFor(() =>
      screen.getByPlaceholderText(/recipient account email/i)
    );
    await userEvent.type(
      screen.getByPlaceholderText(/recipient account email/i),
      'recipient@example.com'
    );
    await userEvent.click(
      screen.getByRole('button', { name: /^transfer vehicle$/i })
    );

    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalled();
      expect(mockTransferVehicle).toHaveBeenCalledWith({
        vin: 'TESTVIN123',
        recipientEmail: 'recipient@example.com',
      });
      expect(global.alert).toHaveBeenCalledWith(
        'Vehicle transferred to recipient@example.com.'
      );
      expect(mockNavigate).toHaveBeenCalledWith('/app');
    });
  });

  it('deletes vehicle when confirmed', async () => {
    mockDeleteVehicle.mockResolvedValue(undefined);
    renderPage();

    await waitFor(() =>
      screen.getByRole('button', { name: /delete vehicle/i })
    );
    await userEvent.click(
      screen.getByRole('button', { name: /delete vehicle/i })
    );

    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalled();
      expect(mockDeleteVehicle).toHaveBeenCalledWith('TESTVIN123');
      expect(global.alert).toHaveBeenCalledWith('Vehicle deleted');
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('does not delete vehicle when confirmation is cancelled', async () => {
    global.confirm.mockReturnValue(false);
    renderPage();

    await waitFor(() =>
      screen.getByRole('button', { name: /delete vehicle/i })
    );
    await userEvent.click(
      screen.getByRole('button', { name: /delete vehicle/i })
    );

    expect(mockDeleteVehicle).not.toHaveBeenCalled();
  });

  it('decodes VIN and updates visible details', async () => {
    mockDecodeVin.mockResolvedValue({
      make: 'Toyota',
      model: 'Camry',
      year: '2021',
      recallsCount: 1,
      recallsSource: 'NHTSA',
      vehicleType: 'Passenger Car',
      bodyClass: 'Sedan',
      fuelType: 'Gasoline',
      engineType: 'I4',
      driveType: 'FWD',
      transmissionStyle: 'Automatic',
      trim: 'SE',
      recallsItems: [],
      vinProfile: {},
    });

    renderPage();

    await waitFor(() => screen.getByRole('button', { name: /decode vin/i }));
    await userEvent.click(screen.getByRole('button', { name: /decode vin/i }));

    await waitFor(() => {
      expect(mockDecodeVin).toHaveBeenCalledWith('TESTVIN123');
      expect(screen.getByText(/1 recall/i)).toBeInTheDocument();
      expect(screen.getByText(/source: nhtsa/i)).toBeInTheDocument();
    });
  });
});
