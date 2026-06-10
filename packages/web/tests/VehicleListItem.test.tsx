import { render, screen } from '@testing-library/react';
import { VehicleListItem } from '../src/components/VehicleListItem';

describe('VehicleListItem Component', () => {
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
        onSelect={jest.fn()}
        alertLevel={null}
      />
    );

    expect(screen.getByText('2020 Honda Civic')).toBeInTheDocument();
    expect(screen.getByText('1HGCM82633A123456')).toBeInTheDocument();
    expect(screen.getByText('50,000 mi')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const handleSelect = jest.fn();
    render(
      <VehicleListItem
        vehicle={mockVehicle}
        isSelected={false}
        onSelect={handleSelect}
        alertLevel={null}
      />
    );

    const button = screen.getByRole('button');
    button.click();
    expect(handleSelect).toHaveBeenCalledWith('1HGCM82633A123456');
  });

  it('shows selected state', () => {
    render(
      <VehicleListItem
        vehicle={mockVehicle}
        isSelected={true}
        onSelect={jest.fn()}
        alertLevel={null}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('border-slate-500');
  });

  it('shows urgent alert', () => {
    render(
      <VehicleListItem
        vehicle={mockVehicle}
        isSelected={false}
        onSelect={jest.fn()}
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
        onSelect={jest.fn()}
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
        onSelect={jest.fn()}
        alertLevel={null}
      />
    );

    expect(screen.getByText('Stored')).toBeInTheDocument();
  });
});
