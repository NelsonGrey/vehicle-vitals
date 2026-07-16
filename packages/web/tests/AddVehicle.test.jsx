import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AddVehicle from '../src/pages/AddVehicle';

const mockNavigate = vi.fn();
const mockAddOrUpdateVehicle = vi.fn();
const mockGetVehicles = vi.fn();
const mockLookupVin = vi.fn();
const mockBuildPersistedVinInsights = vi.fn();
const mockFindVehiclePhotoFromWeb = vi.fn();

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
  lookupVin: (...args) => mockLookupVin(...args),
  buildPersistedVinInsights: (...args) =>
    mockBuildPersistedVinInsights(...args),
}));

vi.mock('../src/utils/vehiclePhotoService', () => ({
  findVehiclePhotoFromWeb: (...args) => mockFindVehiclePhotoFromWeb(...args),
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
    mockFindVehiclePhotoFromWeb.mockResolvedValue(null);
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
    expect(
      screen.getByLabelText(/vehicle id \(vin\/hin\/serial\)/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /vin lookup/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /add vehicle/i })
    ).toBeInTheDocument();
  });

  it('shows subtype options for RVs and trailers', async () => {
    renderPage();

    expect(
      screen.queryByLabelText(/vehicle subtype/i)
    ).not.toBeInTheDocument();

    await userEvent.selectOptions(
      screen.getByLabelText(/vehicle type/i),
      'RVs'
    );
    expect(screen.getByLabelText(/vehicle subtype/i)).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: /motorhome/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: /camping \/ travel trailer/i })
    ).toBeInTheDocument();

    await userEvent.selectOptions(
      screen.getByLabelText(/vehicle type/i),
      'Trailers'
    );
    expect(
      screen.getByRole('option', { name: /boat trailer/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: /utility trailer/i })
    ).toBeInTheDocument();
  });

  it('shows validation alert when saving without VIN', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: /add vehicle/i }));

    expect(global.alert).toHaveBeenCalledWith(
      'A vehicle ID (VIN/HIN/Serial) is required before saving.'
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

  it('looks up VIN and updates preview state', async () => {
    mockLookupVin.mockResolvedValue({
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
      vehicleType: 'Passenger Vehicle',
      recallsItems: [],
      vinProfile: {},
      rawInsights: { source: 'mock' },
    });

    renderPage();

    await userEvent.type(
      screen.getByLabelText(/vehicle id \(vin\/hin\/serial\)/i),
      '1HGCM82633A004352'
    );
    await userEvent.click(screen.getByRole('button', { name: /vin lookup/i }));

    await waitFor(() => {
      expect(mockLookupVin).toHaveBeenCalledWith('1HGCM82633A004352');
      expect(screen.getByText(/2 recalls/i)).toBeInTheDocument();
      expect(screen.getByText(/vehicle specifications/i)).toBeInTheDocument();
    });
  });

  it('saves vehicle and navigates to app on success', async () => {
    mockAddOrUpdateVehicle.mockResolvedValue(undefined);

    renderPage();

    await userEvent.type(
      screen.getByLabelText(/vehicle id \(vin\/hin\/serial\)/i),
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

  it('persists RV subtype selection when saving', async () => {
    mockAddOrUpdateVehicle.mockResolvedValue(undefined);

    renderPage();

    await userEvent.selectOptions(
      screen.getByLabelText(/vehicle type/i),
      'RVs'
    );
    await userEvent.selectOptions(
      screen.getByLabelText(/vehicle subtype/i),
      'Motorhome'
    );
    await userEvent.type(
      screen.getByLabelText(/vehicle id \(vin\/hin\/serial\)/i),
      'RV1234567'
    );
    await userEvent.click(screen.getByRole('button', { name: /add vehicle/i }));

    await waitFor(() => {
      expect(mockAddOrUpdateVehicle).toHaveBeenCalled();
      expect(mockAddOrUpdateVehicle.mock.calls[0][0].vehicleSubtype).toBe(
        'Motorhome'
      );
    });
  });

  it('shows lookup alert if VIN is blank', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /vin lookup/i }));
    expect(global.alert).toHaveBeenCalled();
    const alertMessage = global.alert.mock.calls[0]?.[0] || '';
    expect(alertMessage).toMatch(/non-VIN assets/i);
    expect(alertMessage).toMatch(/Year\/Make\/Model/i);
  });

  it('blocks lookup when VIN check digit is invalid', async () => {
    renderPage();

    await userEvent.type(
      screen.getByLabelText(/vehicle id \(vin\/hin\/serial\)/i),
      '1HGCM82633A004353'
    );
    await userEvent.click(screen.getByRole('button', { name: /vin lookup/i }));

    expect(global.alert).toHaveBeenCalledWith(
      'VIN lookup requires a valid 17-character VIN with a correct check digit.'
    );
    expect(mockLookupVin).not.toHaveBeenCalled();
  });

  it('blocks lookup for HIN identifiers and allows manual save path', async () => {
    renderPage();

    await userEvent.selectOptions(
      screen.getByLabelText(/vehicle type/i),
      'Boats'
    );
    await userEvent.type(
      screen.getByLabelText(/vehicle id \(vin\/hin\/serial\)/i),
      'ABC12345A595'
    );
    await userEvent.click(screen.getByRole('button', { name: /vin lookup/i }));

    expect(global.alert).toHaveBeenCalledWith(
      'VIN lookup currently supports VIN only. Detected HIN. You can still save this vehicle ID and complete details manually.'
    );
    expect(mockLookupVin).not.toHaveBeenCalled();
  });
});
