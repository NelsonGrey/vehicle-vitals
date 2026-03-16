// -----------------------------
// File: shared/types.js

// Default vehicle object structure
export const defaultVehicle = {
  make: '',
  model: '',
  year: '',
  vin: '',
  licensePlate: '',
  mileage: '',
  purchaseDate: '', // ISO date string (e.g., '2025-09-30')
  // Optional computed/scheduled fields for upcoming maintenance
  nextDueByMiles: '', // string to match existing patterns; store numeric miles as string
  nextDueByDate: '', // ISO date string for next due date
  services: [],
};

// Default maintenance record object structure
export const defaultMaintenanceRecord = {
  serviceType: '',
  description: '',
  date: '',
  mileage: '',
  cost: undefined,
  provider: '',
  notes: '',
};

// Common maintenance types
export const MAINTENANCE_TYPES = [
  'Oil Change',
  'Tire Rotation',
  'Brake Inspection',
  'Air Filter',
  'Cabin Filter',
  'Transmission Service',
  'Coolant Flush',
  'Spark Plugs',
  'Battery',
  'Belts & Hoses',
  'Inspection',
  'Other',
];
