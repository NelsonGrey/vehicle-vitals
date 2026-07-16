# Firebase Firestore Composite Indexes

This document describes the composite indexes required for optimized Firestore queries in the Vehicle-Vitals application.

## Required Composite Indexes

### Vehicles Collection

**Index Name:** `vehicles_updatedAt_desc`

**Collection:** `users/{userId}/vehicles`

**Fields:**
- `updatedAt` (Descending)

**Purpose:** Pagination for vehicle list queries ordered by most recently updated.

**Query:**
```javascript
query(collection(db, `users/${userId}/vehicles`), 
  orderBy('updatedAt', 'desc'), 
  limit(pageSize)
);
```

### Maintenance Subcollection

**Index Name:** `maintenance_date_desc`

**Collection:** `users/{userId}/vehicles/{vin}/maintenance`

**Fields:**
- `date` (Descending)

**Purpose:** Pagination for maintenance entries ordered by most recent date.

**Query:**
```javascript
query(collection(db, `users/${userId}/vehicles/${vin}/maintenance`), 
  orderBy('date', 'desc'), 
  limit(pageSize)
);
```

## Source of Truth

Composite index definitions are checked into `firestore.indexes.json` at the repository root. Deploy from the monorepo root:

```bash
firebase deploy --only firestore:indexes
```

## Deployment

To deploy these indexes to your Firebase project, run:

```bash
firebase deploy --only firestore:indexes
```

Or use the Firebase Console:
1. Go to Firestore > Indexes
2. Click "Add Index"
3. Configure according to the specifications above
4. Click "Create"

## Single Field Indexes

The following single field indexes are automatically created by Firestore and don't require manual configuration:

- `vehicleStatus` (Ascending)
- `vin` (Ascending) - used for document lookups
- `make` (Ascending)
- `model` (Ascending)
- `year` (Ascending)

## Pagination Implementation

The shared firestore service now supports pagination:

```javascript
// First page (paginated response)
const result = await getVehicles({ pageSize: 50 });
console.log(result.data); // Array of vehicles
console.log(result.lastDoc); // Last document snapshot for next page
console.log(result.hasMore); // Boolean indicating if more pages exist

// Legacy callers can still omit options and receive a plain array.
const allVehicles = await getVehicles();

// Next page
if (result.hasMore) {
  const nextPage = await getVehicles({
    pageSize: 50,
    startAfter: result.lastDoc,
  });
}
```

### Web Garage Integration

`packages/web/src/pages/Home.tsx` loads the first page on mount and exposes a **Load more vehicles** control when Firestore reports additional pages.

### Mobile Integration

`packages/mobile/lib/services/firestore_service.dart` exposes `getVehiclesPaginated()` and `getMaintenanceEntriesPaginated()` for the same cursor-based Firestore queries.

## Performance Considerations

- Default page size: 50 documents
- Adjust page size based on document size and network conditions
- Use cursor-based pagination (startAfter) for consistent results
- Avoid offset-based pagination for large datasets
