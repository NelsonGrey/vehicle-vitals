// TypeScript declarations for @vehicle-vitals/shared

export interface Vehicle {
  make: string;
  model: string;
  year: string;
  vin: string;
  mileage: string;
  purchaseDate: string;
  nextDueByMiles?: string;
  nextDueByDate?: string;
  services?: MaintenanceRecord[];
}

export interface MaintenanceRecord {
  serviceType: string;
  description: string;
  date: string;
  mileage: string;
  cost?: number;
  provider: string;
  notes: string;
}

export const defaultVehicle: Vehicle;
export const defaultMaintenanceRecord: MaintenanceRecord;
export const MAINTENANCE_TYPES: string[];