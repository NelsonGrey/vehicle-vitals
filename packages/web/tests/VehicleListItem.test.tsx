import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VehicleListItem } from '../src/components/VehicleListItem';

describe('VehicleListItem Component', () => {
  afterEach(() => {
    cleanup();
  });

  const mockVehicle = {
    vin: '1HGCM82633A123456',
    make: 'Honda',
    model: 'Civic',
    year: '2020',
    mileage: '50000',
    photoUrl: 'https://example.com/car.jpg',
    vehicleStatus: 'active' as const,
  };

  it('renders vehicle information', () => {
    render(
      <VehicleListItem
        vehicle={mockVehicle}
        isSelected={false}
        onSelect={vi.fn()}
        alertLevel={null}
      />
    );

    expect(screen.getByText('2020 Honda Civic')).toBeInTheDocument();
    expect(screen.getByText(/1HGCM82633A123456/)).toBeInTheDocument();
    expect(screen.getByText(/50000 mi/)).toBeInTheDocument();
  });

  it('calls onSelect when clicked', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    render(
      <VehicleListItem
        vehicle={mockVehicle}
        isSelected={false}
        onSelect={handleSelect}
        alertLevel={null}
      />
    );

    await user.click(screen.getByTestId('vehicle-list-item-1HGCM82633A123456'));
    expect(handleSelect).toHaveBeenCalledWith('1HGCM82633A123456');
  });

  it('shows selected state', () => {
    render(
      <VehicleListItem
        vehicle={mockVehicle}
        isSelected={true}
        onSelect={vi.fn()}
        alertLevel={null}
      />
    );

    expect(
      screen.getByTestId('vehicle-list-item-1HGCM82633A123456')
    ).toHaveClass('border-slate-500');
  });

  it('shows urgent alert', () => {
    render(
      <VehicleListItem
        vehicle={mockVehicle}
        isSelected={false}
        onSelect={vi.fn()}
        alertLevel="urgent"
      />
    );

    expect(screen.getByText('⚠ Maintenance due!')).toBeInTheDocument();
  });

  it('shows soon alert', () => {
    render(
      <VehicleListItem
        vehicle={mockVehicle}
        isSelected={false}
        onSelect={vi.fn()}
        alertLevel="soon"
      />
    );

    expect(screen.getByText('Service due soon')).toBeInTheDocument();
  });

  it('shows stored status', () => {
    const storedVehicle = { ...mockVehicle, vehicleStatus: 'stored' as const };
    render(
      <VehicleListItem
        vehicle={storedVehicle}
        isSelected={false}
        onSelect={vi.fn()}
        alertLevel={null}
      />
    );

    expect(screen.getByText('Stored')).toBeInTheDocument();
  });
});
