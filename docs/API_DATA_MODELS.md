# Vehicle-Vitals - API & Data Models Documentation

**Version**: 1.1
**Last Reviewed**: July 20, 2026
**Status**: Historical/supporting contract catalog; executable client models, Firestore rules, and private Functions source take precedence
**Owner**: Mark Nelson

---

## Table of Contents

1. [Overview](#overview)
2. [Firebase Functions API](#firebase-functions-api)
3. [Firestore Data Models](#firestore-data-models)
4. [Service Layer Interfaces](#service-layer-interfaces)
5. [External API Integrations](#external-api-integrations)
6. [Error Handling](#error-handling)
7. [Validation Rules](#validation-rules)

---

## Overview

Vehicle-Vitals uses a **Firebase-First Architecture** where:

- **Client apps** communicate directly with Firebase services (Auth, Firestore, Storage)
- **Firebase Functions** handle server-side business logic (VIN lookup, scheduled tasks)
- **Firestore** serves as the primary database with security rules for access control
- **External APIs** (NHTSA VPIC) are called exclusively from Firebase Functions

**No custom REST/GraphQL API server** - all API functionality is provided by Firebase services.

Current implementation also includes enterprise org membership and entitlement callables, premium verification, Stripe checkout/session reconciliation, and compliance request workflows in Firebase Functions.

Functions source is maintained in the private
`NelsonGrey/vehicle-vitals-functions` companion repository and mounted at
`packages/functions` for local work/CI. This long-form catalog may lag exact
callable names; verify against the compatible companion branch before changing
or consuming a server contract.

---

## Firebase Functions API

### Function: `vinLookup`

**Purpose**: Look up a 17-character Vehicle Identification Number (VIN) using NHTSA VPIC API.

**Type**: HTTPS Callable Function  
**Authentication**: Not required (public endpoint)  
**CORS**: Enabled

#### Request

```typescript
POST https://us-central1-vehicle-vitals-prod.cloudfunctions.net/vinLookup
Content-Type: application/json

{
  "vin": "1HGBH41JXMN109186"
}
```

**Request Body Schema**:

```typescript
interface VinLookupRequest {
  vin: string; // 17-character VIN (alphanumeric, no I, O, Q)
}
```

#### Response

**Success (200 OK)**:

```json
{
  "make": "Honda",
  "model": "Accord",
  "year": "2021",
  "vin": "1HGBH41JXMN109186"
}
```

**Response Schema**:

```typescript
interface VinLookupResponse {
  make: string;
  model: string;
  year: string;
  vin: string;
}
```

**Error Responses**:

```json
// 400 Bad Request - Invalid VIN format
{
  "error": "Valid 17-character VIN required"
}

// 500 Internal Server Error - NHTSA API failure
{
  "error": "Failed to look up VIN"
}
```

#### Usage Example

**Web (JavaScript)**:

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const vinLookup = httpsCallable(functions, 'vinLookup');

try {
  const result = await vinLookup({ vin: '1HGBH41JXMN109186' });
  console.log(result.data); // { make: 'Honda', model: 'Accord', year: '2021', vin: '...' }
} catch (error) {
  console.error('VIN lookup failed:', error.message);
}
```

**Mobile (Dart/Flutter)**:

```dart
import 'package:cloud_functions/cloud_functions.dart';

final functions = FirebaseFunctions.instance;

try {
  final result = await functions.httpsCallable('vinLookup').call({
    'vin': '1HGBH41JXMN109186'
  });

  final vehicleData = result.data;
  print('Make: ${vehicleData['make']}'); // Honda
} catch (e) {
  print('VIN lookup failed: $e');
}
```

**Direct HTTP (cURL)**:

```bash
curl -X POST \
  https://us-central1-vehicle-vitals-prod.cloudfunctions.net/vinLookup \
  -H 'Content-Type: application/json' \
  -d '{"vin":"1HGBH41JXMN109186"}'
```

#### Implementation Details

```typescript
// packages/functions/src/index.ts
export const vinLookup = onRequest(
  { cors: true },
  async (request, response) => {
    try {
      // Only allow POST requests
      if (request.method !== 'POST') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
      }

      const { vin } = request.body;

      // Validate VIN format
      if (!vin || typeof vin !== 'string' || vin.length !== 17) {
        response.status(400).json({ error: 'Valid 17-character VIN required' });
        return;
      }

      // Call NHTSA VPIC API
      const vpicUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`;
      const vpicResponse = await fetch(vpicUrl);

      if (!vpicResponse.ok) {
        throw new Error(`NHTSA API returned ${vpicResponse.status}`);
      }

      const vpicData = await vpicResponse.json();

      // Extract vehicle data from VPIC response
      const results = vpicData.Results || [];
      const vehicleData = {
        make: findValue(results, 'Make') || '',
        model: findValue(results, 'Model') || '',
        year: findValue(results, 'ModelYear') || '',
        vin: vin.toUpperCase(),
      };

      response.json(vehicleData);
    } catch (error) {
      logger.error('VIN lookup error', error);
      response.status(500).json({ error: 'Failed to look up VIN' });
    }
  }
);

// Helper function to extract value from VPIC results
function findValue(results: any[], variableName: string): string {
  const item = results.find(r => r.Variable === variableName);
  return item?.Value || '';
}
```

---

### Function: `scheduledMaintenanceReminder` (Future)

**Purpose**: Scheduled function to check for upcoming maintenance tasks and send notifications.

**Type**: Scheduled Function (Cloud Scheduler)  
**Schedule**: Daily at 9:00 AM UTC  
**Authentication**: N/A (automated)

#### Implementation Stub

```typescript
export const scheduledMaintenanceReminder = onSchedule(
  { schedule: '0 9 * * *', timeZone: 'UTC' },
  async event => {
    logger.info('Running scheduled maintenance reminder check');

    // Query vehicles with upcoming maintenance
    const vehiclesSnapshot = await admin
      .firestore()
      .collection('vehicles')
      .where('nextDueByDate', '<=', getDateInDays(7))
      .get();

    // Send notifications to users
    for (const vehicleDoc of vehiclesSnapshot.docs) {
      const vehicle = vehicleDoc.data();
      await sendMaintenanceReminder(vehicle.userId, vehicle);
    }

    logger.info(`Sent ${vehiclesSnapshot.size} maintenance reminders`);
  }
);
```

---

## Firestore Data Models

### Collection: `users`

**Purpose**: Store user profile information and preferences.

**Path**: `/users/{userId}`  
**Document ID**: Firebase Auth UID  
**Security**: User can only read/write their own document

#### Schema

```typescript
interface User {
  email: string;
  displayName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  preferences?: UserPreferences;
}

interface UserPreferences {
  notifications?: boolean; // Email notifications enabled
  theme?: 'light' | 'dark'; // UI theme preference
  defaultMileageUnit?: 'miles' | 'km';
}
```

#### Example Document

```json
{
  "email": "john.doe@example.com",
  "displayName": "John Doe",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-12-20T14:22:00Z",
  "preferences": {
    "notifications": true,
    "theme": "light",
    "defaultMileageUnit": "miles"
  }
}
```

#### Firestore Security Rules

```javascript
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

#### CRUD Operations

**Create User** (Firestore SDK):

```javascript
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

await setDoc(doc(db, 'users', user.uid), {
  email: user.email,
  displayName: user.displayName || '',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  preferences: {
    notifications: true,
    theme: 'light',
  },
});
```

**Read User**:

```javascript
import { doc, getDoc } from 'firebase/firestore';

const userDoc = await getDoc(doc(db, 'users', userId));
const userData = userDoc.data();
```

**Update User**:

```javascript
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

await updateDoc(doc(db, 'users', userId), {
  displayName: 'New Name',
  updatedAt: serverTimestamp(),
});
```

---

### Collection: `vehicles`

**Purpose**: Store vehicle information for each user.

**Path**: `/vehicles/{vehicleId}`  
**Document ID**: Auto-generated by Firestore  
**Security**: User can only access vehicles where `userId` matches their auth UID

#### Schema

```typescript
interface Vehicle {
  userId: string; // Foreign key to users collection (indexed)
  vin: string; // 17-character Vehicle Identification Number
  make: string; // e.g., "Honda", "Toyota"
  model: string; // e.g., "Accord", "Camry"
  year: number; // 4-digit year (e.g., 2021)
  mileage: number; // Current odometer reading
  purchaseDate?: string; // ISO 8601 date string (e.g., "2024-01-15")
  nextDueByMiles?: string; // Next maintenance due at this mileage
  nextDueByDate?: string; // ISO 8601 date string for next maintenance
  createdAt: Timestamp; // Auto-generated on creation
  updatedAt: Timestamp; // Auto-updated on modification
}
```

#### Example Document

```json
{
  "userId": "abc123xyz789",
  "vin": "1HGBH41JXMN109186",
  "make": "Honda",
  "model": "Accord",
  "year": 2021,
  "mileage": 45230,
  "purchaseDate": "2021-06-15",
  "nextDueByMiles": "50000",
  "nextDueByDate": "2025-06-15",
  "createdAt": "2024-01-20T08:15:00Z",
  "updatedAt": "2024-12-10T12:30:00Z"
}
```

#### Firestore Security Rules

```javascript
match /vehicles/{vehicleId} {
  // Users can read their own vehicles
  allow read: if request.auth != null
              && resource.data.userId == request.auth.uid;

  // Users can create vehicles with their userId
  allow create: if request.auth != null
                && request.resource.data.userId == request.auth.uid
                && request.resource.data.vin is string
                && request.resource.data.vin.size() == 17
                && request.resource.data.year is int
                && request.resource.data.year >= 1900
                && request.resource.data.year <= 2100;

  // Users can update/delete their own vehicles
  allow update, delete: if request.auth != null
                        && resource.data.userId == request.auth.uid;
}
```

#### CRUD Operations

**Create Vehicle**:

```javascript
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const newVehicle = {
  userId: user.uid,
  vin: vehicleData.vin.toUpperCase(),
  make: vehicleData.make,
  model: vehicleData.model,
  year: parseInt(vehicleData.year),
  mileage: parseInt(vehicleData.mileage) || 0,
  purchaseDate: vehicleData.purchaseDate || null,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
};

const docRef = await addDoc(collection(db, 'vehicles'), newVehicle);
console.log('Vehicle created with ID:', docRef.id);
```

**Read Vehicles** (for current user):

```javascript
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

const q = query(
  collection(db, 'vehicles'),
  where('userId', '==', user.uid),
  orderBy('createdAt', 'desc')
);

const snapshot = await getDocs(q);
const vehicles = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data(),
}));
```

**Update Vehicle**:

```javascript
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

await updateDoc(doc(db, 'vehicles', vehicleId), {
  mileage: 50000,
  nextDueByMiles: '55000',
  updatedAt: serverTimestamp(),
});
```

**Delete Vehicle**:

```javascript
import { doc, deleteDoc } from 'firebase/firestore';

await deleteDoc(doc(db, 'vehicles', vehicleId));
```

---

### Subcollection: `vehicles/{vehicleId}/maintenance`

**Purpose**: Store maintenance history for each vehicle.

**Path**: `/vehicles/{vehicleId}/maintenance/{maintenanceId}`  
**Document ID**: Auto-generated by Firestore  
**Security**: User must own parent vehicle to access maintenance records

#### Schema

```typescript
interface Maintenance {
  serviceType: string; // From MAINTENANCE_TYPES enum
  description: string; // Human-readable description
  date: string; // ISO 8601 date string (e.g., "2024-12-01")
  mileage: number; // Odometer reading at service time
  cost?: number; // Service cost (optional)
  provider: string; // Mechanic/shop name
  performedBy?: 'self' | 'mechanic' | 'business'; // Who completed or owned the work
  coverage?: 'parts_only' | 'parts_and_labor'; // Receipt coverage or accounting scope
  notes: string; // Additional notes
  createdAt: Timestamp; // Auto-generated on creation
  updatedAt: Timestamp; // Auto-updated on modification
}

// Enum of common maintenance types
const MAINTENANCE_TYPES = [
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
```

#### Example Document

```json
{
  "serviceType": "Oil Change",
  "description": "Synthetic oil change with filter replacement",
  "date": "2024-12-01",
  "mileage": 45000,
  "cost": 65.99,
  "provider": "Jiffy Lube",
  "performedBy": "mechanic",
  "coverage": "parts_and_labor",
  "notes": "Used Mobil 1 synthetic 5W-30",
  "createdAt": "2024-12-01T14:30:00Z",
  "updatedAt": "2024-12-01T14:30:00Z"
}
```

#### Firestore Security Rules

```javascript
match /vehicles/{vehicleId}/maintenance/{maintenanceId} {
  // User must own parent vehicle to access maintenance records
  allow read, write: if request.auth != null
                     && get(/databases/$(database)/documents/vehicles/$(vehicleId)).data.userId == request.auth.uid;
}
```

#### CRUD Operations

**Create Maintenance Record**:

```javascript
import { collection, doc, addDoc, serverTimestamp } from 'firebase/firestore';

const maintenanceData = {
  serviceType: 'Oil Change',
  description: 'Synthetic oil change',
  date: '2024-12-01',
  mileage: 45000,
  cost: 65.99,
  provider: 'Jiffy Lube',
  notes: 'Used Mobil 1 synthetic',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
};

const maintenanceRef = collection(db, `vehicles/${vehicleId}/maintenance`);
await addDoc(maintenanceRef, maintenanceData);
```

**Read Maintenance Records**:

```javascript
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

const q = query(
  collection(db, `vehicles/${vehicleId}/maintenance`),
  orderBy('date', 'desc')
);

const snapshot = await getDocs(q);
const maintenanceRecords = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data(),
}));
```

**Update Maintenance Record**:

```javascript
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

await updateDoc(doc(db, `vehicles/${vehicleId}/maintenance`, maintenanceId), {
  cost: 70.0,
  notes: 'Updated cost after tax',
  updatedAt: serverTimestamp(),
});
```

**Delete Maintenance Record**:

```javascript
import { doc, deleteDoc } from 'firebase/firestore';

await deleteDoc(doc(db, `vehicles/${vehicleId}/maintenance`, maintenanceId));
```

---

### Subcollection: `orgs/{orgId}/financeInvoices`

**Purpose**: Store accounts receivable invoice drafts and lifecycle states per organization.

**Path**: `/orgs/{orgId}/financeInvoices/{invoiceId}`  
**Document ID**: Auto-generated by Firestore  
**Security**: Organization role must include `org_owner`, `org_admin`, or `billing_admin`

#### Schema

```typescript
interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface FinanceInvoice {
  orgId: string;
  customerName: string;
  issueDate: string; // ISO date
  dueDate: string; // ISO date
  currency: string; // e.g. "USD"
  amountDue: number;
  amountPaid: number;
  status: 'draft' | 'sent' | 'partial' | 'paid' | 'void';
  notes?: string;
  lineItems: InvoiceLineItem[];
  createdByUid: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Callable Contract (Draft Scaffold)

`createInvoiceDraftCallable`

- Required fields: `orgId`, `customerName`, `dueDate`
- Optional fields: `issueDate`, `currency`, `amountDue`, `notes`, `lineItems`, `idempotencyKey`
- Behavior: creates draft invoice under `orgs/{orgId}/financeInvoices`, writes audit event, returns `{ success, orgId, invoiceId, status }`

---

### Subcollection: `orgs/{orgId}/financePayables`

**Purpose**: Store accounts payable bill drafts and lifecycle states per organization.

**Path**: `/orgs/{orgId}/financePayables/{payableId}`  
**Document ID**: Auto-generated by Firestore  
**Security**: Organization role must include `org_owner`, `org_admin`, or `billing_admin`

#### Schema

```typescript
interface FinancePayable {
  orgId: string;
  vendorName: string;
  billDate: string; // ISO date
  dueDate: string; // ISO date
  currency: string; // e.g. "USD"
  amountDue: number;
  amountPaid: number;
  status: 'draft' | 'approved' | 'scheduled' | 'paid' | 'void';
  category?: string;
  notes?: string;
  createdByUid: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Callable Contract (Draft Scaffold)

`createPayableDraftCallable`

- Required fields: `orgId`, `vendorName`, `dueDate`
- Optional fields: `billDate`, `currency`, `amountDue`, `category`, `notes`, `idempotencyKey`
- Behavior: creates draft payable under `orgs/{orgId}/financePayables`, writes audit event, returns `{ success, orgId, payableId, status }`

---

## Service Layer Interfaces

### Web Application Services

#### `vehicleService.js`

**Purpose**: Abstraction layer for vehicle CRUD operations.

```javascript
// packages/web/src/utils/vehicleService.js
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../shared/firebaseConfig';

export const vehicleService = {
  /**
   * Create a new vehicle
   * @param {string} userId - Current user's UID
   * @param {Object} vehicleData - Vehicle data (vin, make, model, year, mileage)
   * @returns {Promise<string>} - Created vehicle document ID
   */
  async createVehicle(userId, vehicleData) {
    const vehicle = {
      userId,
      vin: vehicleData.vin.toUpperCase(),
      make: vehicleData.make,
      model: vehicleData.model,
      year: parseInt(vehicleData.year),
      mileage: parseInt(vehicleData.mileage) || 0,
      purchaseDate: vehicleData.purchaseDate || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'vehicles'), vehicle);
    return docRef.id;
  },

  /**
   * Update an existing vehicle
   * @param {string} vehicleId - Vehicle document ID
   * @param {Object} updates - Fields to update
   */
  async updateVehicle(vehicleId, updates) {
    await updateDoc(doc(db, 'vehicles', vehicleId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Delete a vehicle and all its maintenance records
   * @param {string} vehicleId - Vehicle document ID
   */
  async deleteVehicle(vehicleId) {
    // Note: Firestore does not auto-delete subcollections
    // In production, use Firebase Extension "Delete Collections" or Cloud Function
    await deleteDoc(doc(db, 'vehicles', vehicleId));
  },
};
```

#### `vpicService.js`

**Purpose**: Interface to NHTSA VIN lookup Firebase Function.

```javascript
// packages/web/src/utils/vpicService.js
import { getFunctions, httpsCallable } from 'firebase/functions';
import { functions } from '../shared/firebaseConfig';

export const vpicService = {
  /**
   * Look up a VIN using Firebase Function
   * @param {string} vin - 17-character VIN
   * @returns {Promise<Object>} - Vehicle data {make, model, year, vin}
   * @throws {Error} - If VIN is invalid or API fails
   */
  async vinLookup(vin) {
    const vinLookup = httpsCallable(functions, 'vinLookup');

    try {
      const result = await vinLookup({ vin: vin.trim().toUpperCase() });
      return result.data;
    } catch (error) {
      console.error('VIN lookup error:', error);
      throw new Error(error.message || 'Failed to look up VIN');
    }
  },

  /**
   * Validate VIN format (client-side check)
   * @param {string} vin - VIN to validate
   * @returns {boolean} - True if valid format
   */
  validateVINFormat(vin) {
    // 17 characters, alphanumeric, excluding I, O, Q
    return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin);
  },
};
```

### Mobile Application Services

#### `firestore_service.dart`

**Purpose**: Centralized Firestore operations for Flutter app.

```dart
// packages/mobile/lib/services/firestore_service.dart
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/vehicle.dart';
import '../models/maintenance.dart';

class FirestoreService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  /// Fetch all vehicles for the current user
  Stream<List<Vehicle>> getVehicles(String userId) {
    return _db
        .collection('vehicles')
        .where('userId', isEqualTo: userId)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => Vehicle.fromMap({...doc.data(), 'id': doc.id}))
            .toList());
  }

  /// Create a new vehicle
  Future<String> createVehicle(Vehicle vehicle) async {
    final docRef = await _db.collection('vehicles').add(vehicle.toMap());
    return docRef.id;
  }

  /// Update an existing vehicle
  Future<void> updateVehicle(String vehicleId, Map<String, dynamic> updates) {
    return _db.collection('vehicles').doc(vehicleId).update({
      ...updates,
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }

  /// Delete a vehicle
  Future<void> deleteVehicle(String vehicleId) {
    return _db.collection('vehicles').doc(vehicleId).delete();
  }

  /// Fetch maintenance records for a vehicle
  Stream<List<Maintenance>> getMaintenanceRecords(String vehicleId) {
    return _db
        .collection('vehicles/$vehicleId/maintenance')
        .orderBy('date', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => Maintenance.fromMap(doc.data(), doc.id))
            .toList());
  }

  /// Create a maintenance record
  Future<void> createMaintenanceRecord(
      String vehicleId, Maintenance maintenance) {
    return _db
        .collection('vehicles/$vehicleId/maintenance')
        .add(maintenance.toMap());
  }

  /// Update a maintenance record
  Future<void> updateMaintenanceRecord(
      String vehicleId, String maintenanceId, Map<String, dynamic> updates) {
    return _db
        .collection('vehicles/$vehicleId/maintenance')
        .doc(maintenanceId)
        .update({
      ...updates,
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }

  /// Delete a maintenance record
  Future<void> deleteMaintenanceRecord(
      String vehicleId, String maintenanceId) {
    return _db
        .collection('vehicles/$vehicleId/maintenance')
        .doc(maintenanceId)
        .delete();
  }
}
```

---

## External API Integrations

### NHTSA VPIC API

**Base URL**: `https://vpic.nhtsa.dot.gov/api/`  
**Documentation**: https://vpic.nhtsa.dot.gov/api/

#### Endpoint: Decode VIN

**URL**: `GET /vehicles/DecodeVin/{VIN}?format=json`

**Request**:

```
GET https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/1HGBH41JXMN109186?format=json
```

**Response** (abbreviated):

```json
{
  "Count": 136,
  "Message": "Results returned successfully",
  "Results": [
    {
      "Variable": "Make",
      "Value": "HONDA"
    },
    {
      "Variable": "Model",
      "Value": "Accord"
    },
    {
      "Variable": "ModelYear",
      "Value": "2021"
    },
    {
      "Variable": "VehicleType",
      "Value": "PASSENGER VEHICLE"
    }
    // ... 132 more fields
  ]
}
```

**Rate Limits**: None publicly documented (use responsibly)

**Error Handling**:

- **Invalid VIN**: Returns 200 OK but `Results` array contains error messages
- **Server Error**: Returns 5xx status codes

**Caching Strategy**:

```typescript
// Cache VIN lookups in Firestore to reduce API calls
const vinCacheRef = doc(db, 'vinCache', vin);
const cached = await getDoc(vinCacheRef);

if (cached.exists() && !isCacheExpired(cached.data().timestamp)) {
  return cached.data().vehicleData;
}

// Call NHTSA API
const vehicleData = await fetchFromNHTSA(vin);

// Cache result for 90 days
await setDoc(vinCacheRef, {
  vehicleData,
  timestamp: serverTimestamp(),
});

return vehicleData;
```

---

## Error Handling

### Client-Side Error Handling

#### Web Application

```typescript
// Error handling wrapper for Firestore operations
export async function safeFirestoreOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<T | null> {
  try {
    return await operation();
  } catch (error: any) {
    console.error(errorMessage, error);

    // User-friendly error messages
    if (error.code === 'permission-denied') {
      alert('You do not have permission to perform this action');
    } else if (error.code === 'unavailable') {
      alert('Service temporarily unavailable. Please try again later.');
    } else {
      alert(`Error: ${errorMessage}`);
    }

    return null;
  }
}

// Usage
const vehicles = await safeFirestoreOperation(
  () => getDocs(vehiclesQuery),
  'Failed to fetch vehicles'
);
```

#### Mobile Application

```dart
// Exception handling for Firestore operations
class FirestoreException implements Exception {
  final String message;
  final String? code;

  FirestoreException(this.message, [this.code]);

  @override
  String toString() => 'FirestoreException: $message';
}

Future<List<Vehicle>> getVehiclesWithErrorHandling(String userId) async {
  try {
    final snapshot = await _db
        .collection('vehicles')
        .where('userId', isEqualTo: userId)
        .get();

    return snapshot.docs.map((doc) => Vehicle.fromMap(doc.data())).toList();
  } on FirebaseException catch (e) {
    if (e.code == 'permission-denied') {
      throw FirestoreException('Permission denied', e.code);
    } else if (e.code == 'unavailable') {
      throw FirestoreException('Service unavailable', e.code);
    } else {
      throw FirestoreException('Failed to fetch vehicles: ${e.message}', e.code);
    }
  }
}
```

### Server-Side Error Handling (Firebase Functions)

```typescript
export const vinLookup = onRequest(
  { cors: true },
  async (request, response) => {
    try {
      // Validation errors
      if (!request.body.vin) {
        response.status(400).json({
          error: 'VIN is required',
          code: 'MISSING_VIN',
        });
        return;
      }

      // Call external API
      const vehicleData = await callNHTSA(request.body.vin);
      response.json(vehicleData);
    } catch (error: any) {
      logger.error('VIN lookup failed', {
        vin: request.body.vin,
        error: error.message,
        stack: error.stack,
      });

      // Generic error response
      response.status(500).json({
        error: 'Failed to look up VIN',
        code: 'INTERNAL_ERROR',
      });
    }
  }
);
```

---

## Validation Rules

### VIN Validation

**Format**: 17 alphanumeric characters (excluding I, O, Q)

**Client-Side**:

```javascript
function validateVIN(vin) {
  if (!vin || typeof vin !== 'string') {
    return { valid: false, error: 'VIN is required' };
  }

  if (vin.length !== 17) {
    return { valid: false, error: 'VIN must be 17 characters' };
  }

  if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)) {
    return {
      valid: false,
      error: 'Invalid VIN format (no I, O, or Q allowed)',
    };
  }

  return { valid: true };
}
```

**Server-Side** (Firebase Functions):

```typescript
function validateVIN(vin: string): boolean {
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin);
}
```

**Firestore Security Rule**:

```javascript
match /vehicles/{vehicleId} {
  allow create: if request.resource.data.vin is string
                && request.resource.data.vin.size() == 17
                && request.resource.data.vin.matches('^[A-HJ-NPR-Z0-9]{17}$');
}
```

### Vehicle Data Validation

**Firestore Security Rules**:

```javascript
function isValidVehicle() {
  let data = request.resource.data;
  return data.userId is string
      && data.vin is string
      && data.vin.size() == 17
      && data.make is string
      && data.model is string
      && data.year is int
      && data.year >= 1900
      && data.year <= 2100
      && data.mileage is int
      && data.mileage >= 0;
}

match /vehicles/{vehicleId} {
  allow create: if request.auth != null
                && request.resource.data.userId == request.auth.uid
                && isValidVehicle();
}
```

### Maintenance Data Validation

**Firestore Security Rules**:

```javascript
function isValidMaintenance() {
  let data = request.resource.data;
  return data.serviceType is string
      && data.date is string
      && data.mileage is int
      && data.mileage >= 0
      && (!('cost' in data) || data.cost is number)
      && data.provider is string;
}

match /vehicles/{vehicleId}/maintenance/{maintenanceId} {
  allow create: if request.auth != null
                && get(/databases/$(database)/documents/vehicles/$(vehicleId)).data.userId == request.auth.uid
                && isValidMaintenance();
}
```

---

## Appendix

### Common Firestore Error Codes

| Code                  | Description                              | User-Friendly Message                              |
| --------------------- | ---------------------------------------- | -------------------------------------------------- |
| `permission-denied`   | User lacks permission for this operation | "You don't have permission to access this data"    |
| `not-found`           | Document does not exist                  | "The requested item was not found"                 |
| `already-exists`      | Document already exists (set operation)  | "This item already exists"                         |
| `unavailable`         | Service temporarily unavailable          | "Service temporarily unavailable, try again later" |
| `unauthenticated`     | User not authenticated                   | "Please log in to continue"                        |
| `resource-exhausted`  | Quota exceeded                           | "Service limit exceeded, please try again later"   |
| `failed-precondition` | Operation rejected due to system state   | "Unable to complete operation, please refresh"     |

### Testing with Firestore Emulator

**Start Emulator**:

```bash
firebase emulators:start --only firestore
```

**Connect Client to Emulator**:

```javascript
// Web
import { connectFirestoreEmulator } from 'firebase/firestore';

if (import.meta.env.DEV) {
  connectFirestoreEmulator(db, 'localhost', 8080);
}
```

```dart
// Flutter
if (kDebugMode) {
  FirebaseFirestore.instance.useFirestoreEmulator('localhost', 8080);
}
```

---

**Document Revision History**:

- **v1.0** (Feb 16, 2026): Initial API and data model documentation

**Maintained By**: Mark Nelson  
**Review Cycle**: Quarterly or on schema changes  
**Feedback**: Submit issues or PRs to [GitHub repository](https://github.com/NelsonGrey/vehicle-vitals)
