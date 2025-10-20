// Main exports for @vehicle-vitals/shared package

// Firebase configuration and services
export { firebaseConfig } from './firebaseConfig.js';
export { createFirestoreService } from './firestoreServiceFactory.js';
// export { default as firestoreService } from './firestoreService.js'; // Removed - use factory instead

// Types and utilities
export * from './types.js';

// Re-export common utilities
export { serverTimestamp } from 'firebase/firestore';