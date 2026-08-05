# @vehicle-vitals/shared

Shared utilities and Firebase services for the Vehicle-Vitals monorepo.

## Features

- 🔥 Firebase configuration and services
- 📊 Firestore service factory with authentication
- 🏷️ TypeScript types and interfaces

## Usage

```javascript
import { createFirestoreService, defaultVehicle } from '@vehicle-vitals/shared';
import { firebaseConfig } from '@vehicle-vitals/shared/firebase';

// Create Firestore service
const firestoreService = createFirestoreService(auth, db);

// Use shared types
const newVehicle = { ...defaultVehicle, vin: 'ABC123' };
```

## Exports

- `createFirestoreService` - Factory for Firestore service
- `firebaseConfig` - Firebase configuration
- `defaultVehicle` - Default vehicle object structure

## Development

```bash
npm test        # Run tests
npm run lint    # Lint code
```