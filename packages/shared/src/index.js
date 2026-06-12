// @ts-check

/** @typedef {Object} Vehicle
 * @property {string} make
 * @property {string} model
 * @property {string} year
 * @property {string} vin
 * @property {'active'|'stored'} [vehicleStatus]
 * @property {string} [vehicleType]
 * @property {string} [photoUrl]
 * @property {string} [photoPath]
 * @property {string} [photoSource]
 * @property {string} [photoAttributionUrl]
 * @property {string} [photoAttributionText]
 * @property {string} [licensePlate]
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
 * @property {'self'|'mechanic'|'business'} [performedBy]
 * @property {'parts_only'|'parts_and_labor'} [coverage]
 * @property {string} notes
 */

/** @typedef {Object} InvoiceLineItem
 * @property {string} description
 * @property {number} quantity
 * @property {number} unitPrice
 */

/** @typedef {Object} InvoiceDraft
 * @property {string} orgId
 * @property {string} customerName
 * @property {string} issueDate
 * @property {string} dueDate
 * @property {string} currency
 * @property {number} [amountDue]
 * @property {number} [amountPaid]
 * @property {'draft'|'sent'|'partial'|'paid'|'void'} [status]
 * @property {string} [notes]
 * @property {InvoiceLineItem[]} [lineItems]
 */

/** @typedef {Object} PayableDraft
 * @property {string} orgId
 * @property {string} vendorName
 * @property {string} billDate
 * @property {string} dueDate
 * @property {string} currency
 * @property {number} [amountDue]
 * @property {number} [amountPaid]
 * @property {'draft'|'approved'|'scheduled'|'paid'|'void'} [status]
 * @property {string} [category]
 * @property {string} [notes]
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
  vehicleStatus: 'active',
  vehicleType: '',
  photoUrl: '',
  photoPath: '',
  photoSource: '',
  photoAttributionUrl: '',
  photoAttributionText: '',
  licensePlate: '',
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
  performedBy: 'mechanic',
  coverage: 'parts_and_labor',
  notes: '',
};

// Default accounts receivable invoice draft structure
/** @type {InvoiceDraft} */
export const defaultInvoiceDraft = {
  orgId: '',
  customerName: '',
  issueDate: '',
  dueDate: '',
  currency: 'USD',
  amountDue: undefined,
  amountPaid: 0,
  status: 'draft',
  notes: '',
  lineItems: [],
};

// Default accounts payable bill draft structure
/** @type {PayableDraft} */
export const defaultPayableDraft = {
  orgId: '',
  vendorName: '',
  billDate: '',
  dueDate: '',
  currency: 'USD',
  amountDue: undefined,
  amountPaid: 0,
  status: 'draft',
  category: '',
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
export {
  computeVehicleHealthSnapshot,
  inferHealthComponentIds,
  VEHICLE_HEALTH_COMPONENTS,
} from './vehicleHealth.js';
