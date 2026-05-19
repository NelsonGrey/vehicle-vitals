import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AddVehicle from '../src/pages/AddVehicle';

const mockNavigate = vi.fn();
const mockAddOrUpdateVehicle = vi.fn();
const mockGetVehicles = vi.fn();
const mockDecodeVin = vi.fn();
const mockBuildPersistedVinInsights = vi.fn();

vi.mock('@vehicle-vitals/shared', () => ({
  defaultVehicle: {
    year: '',
    make: '',
    model: '',
    vin: '',
    licensePlate: '',
    mileage: '',
    purchaseDate: '',
  },
}));

vi.mock('../src/hooks/useVehicleOptions', () => ({
  default: () => ({
    years: ['2020', '2021'],
    makes: ['Toyota', 'Honda'],
    models: ['Camry', 'Corolla'],
    loadingMakes: false,
    loadingModels: false,
  }),
}));

vi.mock('../src/shared/firestoreService', () => ({
  addOrUpdateVehicle: (...args) => mockAddOrUpdateVehicle(...args),
  getVehicles: (...args) => mockGetVehicles(...args),
}));

vi.mock('../src/shared/licensePlateUtils', () => ({
  normalizeLicensePlate: value => value.trim().toUpperCase(),
  validateLicensePlate: value =>
    value.includes('!')
      ? { valid: false, error: 'Invalid license plate format' }
      : { valid: true, error: undefined },
}));

vi.mock('../src/utils/vehicleService', () => ({
  decodeVin: (...args) => mockDecodeVin(...args),
  buildPersistedVinInsights: (...args) =>
    mockBuildPersistedVinInsights(...args),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderPage() {
  return render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <AddVehicle />
    </MemoryRouter>
  );
}

describe('AddVehicle page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('alert', vi.fn());
    mockBuildPersistedVinInsights.mockReturnValue({ persisted: true });
    mockGetVehicles.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders core fields and actions', () => {
    renderPage();

    expect(
      screen.getByRole('heading', { name: /add vehicle/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/year/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/make/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/model/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^vin$/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /decode vin/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /add vehicle/i })
    ).toBeInTheDocument();
  });

  it('shows validation alert when saving without VIN', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: /add vehicle/i }));

    expect(global.alert).toHaveBeenCalledWith(
      'VIN is required before saving a vehicle.'
    );
    expect(mockAddOrUpdateVehicle).not.toHaveBeenCalled();
  });

  it('normalizes license plate input and shows validation error when invalid', async () => {
    renderPage();

    const plateInput = screen.getByLabelText(/license plate/i);
    await userEvent.type(plateInput, 'abc!');

    expect(plateInput).toHaveValue('ABC!');
    expect(
      screen.getByText(/invalid license plate format/i)
    ).toBeInTheDocument();
  });

  it('decodes VIN and updates preview state', async () => {
    mockDecodeVin.mockResolvedValue({
      make: 'Toyota',
      model: 'Camry',
      year: '2020',
      recallsCount: 2,
      recallsSource: 'NHTSA',
      engineType: 'I4',
      bodyClass: 'Sedan',
      fuelType: 'Gasoline',
      driveType: 'FWD',
      transmissionStyle: 'Automatic',
      trim: 'LE',
      vehicleType: 'Passenger Car',
      recallsItems: [],
      vinProfile: {},
      rawInsights: { source: 'mock' },
    });

    renderPage();

    await userEvent.type(screen.getByLabelText(/^vin$/i), '1HGCM82633A004352');
    await userEvent.click(screen.getByRole('button', { name: /decode vin/i }));

    await waitFor(() => {
      expect(mockDecodeVin).toHaveBeenCalledWith('1HGCM82633A004352');
      expect(screen.getByText(/2 recalls/i)).toBeInTheDocument();
      expect(screen.getByText(/vehicle specifications/i)).toBeInTheDocument();
    });
  });

  it('saves vehicle and navigates to app on success', async () => {
    mockAddOrUpdateVehicle.mockResolvedValue(undefined);

    renderPage();

    await userEvent.type(
      screen.getByLabelText(/^vin$/i),
      ' 1HGCM82633A004352 '
    );
    await userEvent.type(screen.getByLabelText(/mileage/i), '50000');
    await userEvent.click(screen.getByRole('button', { name: /add vehicle/i }));

    await waitFor(() => {
      expect(mockAddOrUpdateVehicle).toHaveBeenCalled();
      const payload = mockAddOrUpdateVehicle.mock.calls[0][0];
      expect(payload.vin).toBe('1HGCM82633A004352');
      expect(global.alert).toHaveBeenCalledWith('Vehicle added successfully');
      expect(mockNavigate).toHaveBeenCalledWith('/app');
    });
  });

  it('shows decode alert if VIN is blank', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /decode vin/i }));
    expect(global.alert).toHaveBeenCalledWith(
      'Enter the VIN first. If VIN lookup cannot fill every field, you can still type Year, Make, and Model yourself before saving.'
    );
  });
});
