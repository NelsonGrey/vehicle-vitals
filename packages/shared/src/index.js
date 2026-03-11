// @ts-check

/** @typedef {Object} Vehicle
 * @property {string} make
 * @property {string} model
 * @property {string} year
 * @property {string} vin
 * @property {string} mileage
 * @property {string} purchaseDate
 * @property {string} [nextDueByMiles]
 * @property {string} [nextDueByDate]
 * @property {MaintenanceRecord[]} [services]
 */

/** @typedef {Object} MaintenanceRecord
 * @property {string} serviceType
 * @property {string} description
 * @property {string} date
 * @property {string} mileage
 * @property {number} [cost]
 * @property {string} provider
 * @property {string} notes
 */

// Main exports for @vehicle-vitals/shared package

// Firebase configuration and services
export { firebaseConfig } from './firebaseConfig.js';
export { createFirestoreService } from './firestoreServiceFactory.js';
export { createStandardVehiclePortfolio } from './vehiclePortfolio.js';
// export { default as firestoreService } from './firestoreService.js'; // Removed - use factory instead

// Default vehicle object structure
/** @type {Vehicle} */
export const defaultVehicle = {
  make: '',
  model: '',
  year: '',
  vin: '',
  mileage: '',
  purchaseDate: '', // ISO date string (e.g., '2025-09-30')
  // Optional computed/scheduled fields for upcoming maintenance
  nextDueByMiles: '', // string to match existing patterns; store numeric miles as string
  nextDueByDate: '', // ISO date string for next due date
  services: [],
};

// Default maintenance record object structure
/** @type {MaintenanceRecord} */
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

// Re-export common utilities
export { serverTimestamp } from 'firebase/firestore';

// Maintenance schedules
export {
  getUpcomingMaintenance,
  manufacturerSchedules,
} from './maintenanceSchedules.js';
