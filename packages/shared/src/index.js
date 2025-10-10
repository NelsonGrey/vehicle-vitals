// Main exports for @vehicle-vitals/shared package

// Firebase configuration and services
export { default as firebaseConfig } from './firebaseConfig.js';
export { createFirestoreService } from './firestoreServiceFactory.js';
export { default as firestoreService } from './firestoreService.js';

// Types and utilities
export * from './types.js';

// Azure configuration (when implemented)
export { default as azureConfig } from './azureConfig.js';

// Re-export common utilities
export { serverTimestamp } from 'firebase/firestore';