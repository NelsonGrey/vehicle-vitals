import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ServiceProviders from '../src/pages/ServiceProviders';
import {
  getVehicle,
  getVehicles,
  updateVehicle,
} from '../src/shared/firestoreService';
import { getLocalServiceProviders } from '../src/utils/localServiceProviders';

vi.mock('../src/shared/firestoreService', () => ({
  getVehicle: vi.fn(),
  getVehicles: vi.fn(),
  updateVehicle: vi.fn(),
}));

vi.mock('../src/utils/localServiceProviders', () => ({
  getLocalServiceProviders: vi.fn(),
}));

const STUB_PROVIDERS = [
  {
    id: 'shop-1',
    type: 'repair_shop',
    name: 'Main Street Auto',
    address: '123 Main St, Springfield, IL 62701',
    distanceMiles: 2.4,
    rating: 4.5,
    phone: '555-100-0001',
    specialties: ['oil change', 'brake service'],
    website: 'https://mainsteetauto.example.com',
  },
  {
    id: 'dealer-1',
    type: 'dealership',
    name: 'Elite Toyota',
    address: '456 Oak Ave, Springfield, IL 62701',
    distanceMiles: 5.1,
    rating: 4.2,
    phone: '555-200-0002',
    specialties: ['Toyota certified'],
    website: null,
  },
];

describe('ServiceProviders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    getVehicle.mockResolvedValue(null);
    getVehicles.mockResolvedValue([]);
    updateVehicle.mockResolvedValue(undefined);
    getLocalServiceProviders.mockResolvedValue({
      source: 'location_fallback',
      providers: STUB_PROVIDERS,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders page heading and key form controls', async () => {
    render(<ServiceProviders />);

    await waitFor(() => screen.getByText('Mechanics'));
    expect(screen.getByText('Search Preferences')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /find nearby mechanics/i })
    ).toBeInTheDocument();
  });

  it('calls getVehicle for preferences and getVehicles for makes on mount', async () => {
    render(<ServiceProviders />);

    await waitFor(() => expect(getVehicle).toHaveBeenCalledWith('preferences'));
    expect(getVehicles).toHaveBeenCalled();
  });

  it('pre-fills address and radius from saved preferences', async () => {
    getVehicle.mockResolvedValue({
      preferredProviderRadiusMiles: 50,
      preferredProviderType: 'repair_shop',
      homeAddress: {
        street1: '10 Elm St',
        city: 'Shelbyville',
        stateProvince: 'IL',
        postalCode: '62565',
        country: 'US',
      },
    });

    render(<ServiceProviders />);

    await waitFor(() =>
      expect(screen.getByDisplayValue('10 Elm St')).toBeInTheDocument()
    );
    expect(screen.getByDisplayValue('Shelbyville')).toBeInTheDocument();
    expect(screen.getByDisplayValue('50')).toBeInTheDocument();
  });

  it('shows validation error when required address fields are absent', async () => {
    render(<ServiceProviders />);
    await waitFor(() => screen.getByText('Mechanics'));

    fireEvent.click(
      screen.getByRole('button', { name: /find nearby mechanics/i })
    );

    await waitFor(() =>
      screen.getByText(/street, city, and state are required/i)
    );
    expect(getLocalServiceProviders).not.toHaveBeenCalled();
  });

  it('calls getLocalServiceProviders with form values and renders results', async () => {
    render(<ServiceProviders />);
    await waitFor(() => screen.getByText('Mechanics'));

    fireEvent.change(screen.getByLabelText(/^street$/i), {
      target: { value: '99 Oak Blvd' },
    });
    fireEvent.change(screen.getByLabelText(/^city$/i), {
      target: { value: 'Springfield' },
    });
    fireEvent.change(screen.getByLabelText(/^state$/i), {
      target: { value: 'IL' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /find nearby mechanics/i })
    );

    await waitFor(() =>
      expect(getLocalServiceProviders).toHaveBeenCalledWith(
        expect.objectContaining({
          locationQuery: expect.stringContaining('Springfield'),
          radiusMiles: 25,
        })
      )
    );
    expect(await screen.findByText('Main Street Auto')).toBeInTheDocument();
    expect(screen.getByText('Elite Toyota')).toBeInTheDocument();
  });

  it('persists preferences via updateVehicle after a successful lookup', async () => {
    render(<ServiceProviders />);
    await waitFor(() => screen.getByText('Mechanics'));

    fireEvent.change(screen.getByLabelText(/^street$/i), {
      target: { value: '1 Maple Dr' },
    });
    fireEvent.change(screen.getByLabelText(/^city$/i), {
      target: { value: 'Naperville' },
    });
    fireEvent.change(screen.getByLabelText(/^state$/i), {
      target: { value: 'IL' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /find nearby mechanics/i })
    );

    await waitFor(() =>
      expect(updateVehicle).toHaveBeenCalledWith(
        'preferences',
        expect.objectContaining({
          homeAddress: expect.objectContaining({ city: 'Naperville' }),
          preferredProviderRadiusMiles: 25,
        })
      )
    );
  });

  it('shows error message when provider lookup throws', async () => {
    getLocalServiceProviders.mockRejectedValue(new Error('Network timeout'));

    render(<ServiceProviders />);
    await waitFor(() => screen.getByText('Mechanics'));

    fireEvent.change(screen.getByLabelText(/^street$/i), {
      target: { value: '5 Pine Ave' },
    });
    fireEvent.change(screen.getByLabelText(/^city$/i), {
      target: { value: 'Rockford' },
    });
    fireEvent.change(screen.getByLabelText(/^state$/i), {
      target: { value: 'IL' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /find nearby mechanics/i })
    );

    await waitFor(() => screen.getByText(/network timeout/i));
    expect(updateVehicle).not.toHaveBeenCalled();
  });

  it('populates vehicle make dropdown from garage vehicles', async () => {
    getVehicles.mockResolvedValue([
      { make: 'Toyota', model: 'Camry' },
      { make: 'Honda', model: 'Civic' },
    ]);

    render(<ServiceProviders />);

    // Honda sorts first alphabetically and becomes the default selection
    await waitFor(() =>
      expect(
        screen.getByRole('combobox', { name: /vehicle make/i })
      ).toHaveDisplayValue('Honda')
    );
    const makeSelect = screen.getByRole('combobox', { name: /vehicle make/i });
    const optionValues = [...makeSelect.options].map(o => o.value);
    expect(optionValues).toContain('Toyota');
    expect(optionValues).toContain('Honda');
  });

  it('shows success status after providers load', async () => {
    render(<ServiceProviders />);
    await waitFor(() => screen.getByText('Mechanics'));

    fireEvent.change(screen.getByLabelText(/^street$/i), {
      target: { value: '7 Birch Ln' },
    });
    fireEvent.change(screen.getByLabelText(/^city$/i), {
      target: { value: 'Aurora' },
    });
    fireEvent.change(screen.getByLabelText(/^state$/i), {
      target: { value: 'IL' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /find nearby mechanics/i })
    );

    await waitFor(() => screen.getByText(/nearby mechanics updated/i));
  });
});
