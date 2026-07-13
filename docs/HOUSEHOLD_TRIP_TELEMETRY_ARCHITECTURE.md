# Household Trip Telemetry Architecture

## Goal

Support shared garages where multiple people belong to the same household and
multiple vehicles belong to that household, without double-counting trips or
assigning mileage to the wrong vehicle.

This design is specifically meant to solve:

- multiple drivers in one household
- multiple vehicles in one household
- multiple household members riding in the same vehicle on the same trip
- multiple devices recording the same trip
- low-confidence trip-to-vehicle assignment that needs review

## Current Repo Constraints

The current product is still centered on per-user vehicle ownership:

- mobile reads and writes vehicles at `users/{uid}/vehicles/{vin}`
- web storage paths are based on `users/{uid}/vehicles/{vin}`
- functions read reminders, maintenance, and integrations from
  `users/{uid}/vehicles/{vin}`
- account consolidation and vehicle transfer move vehicles between user
  accounts, which reinforces a single-owner model

At the same time, the backend already has organization scaffolding:

- `orgs/{orgId}`
- `orgs/{orgId}/members/{uid}`
- `users/{uid}/orgMemberships/{orgId}`

That organization model should become the basis for shared household garages
instead of introducing a second parallel concept such as `groups`.

## Recommended Domain Model

Use `orgs/{orgId}` as the shared container and introduce a household org type.

### Organization Types

- `personal`: current single-user default
- `household`: shared family garage
- `business`: reserved for future fleet / shop use

### Core Principle

Raw device trip capture must not write directly to canonical vehicle mileage or
vehicle history.

Instead:

1. devices write raw trip observations
2. backend reconciliation merges observations into one canonical trip
3. canonical trip is assigned to one vehicle with a confidence score
4. mileage and analytics derive from canonical trips only

This avoids duplicate trips when two people in the same vehicle record the same
journey.

## Firestore Shape

### Shared Garage

```text
orgs/{orgId}
orgs/{orgId}/members/{uid}
orgs/{orgId}/vehicles/{vehicleId}
orgs/{orgId}/tripObservations/{observationId}
orgs/{orgId}/trips/{tripId}
orgs/{orgId}/vehicleBindings/{bindingId}
orgs/{orgId}/tripReviewQueue/{reviewId}
```

### User-Specific Convenience Data

```text
users/{uid}/orgMemberships/{orgId}
users/{uid}/tripInbox/{tripId}
users/{uid}/devices/{deviceId}
```

User documents remain useful for auth, preferences, and personal views, but the
household's vehicles and trips should live under the organization.

## Proposed Documents

### `orgs/{orgId}`

```json
{
  "orgId": "abc123",
  "name": "Nelson Household",
  "type": "household",
  "planTier": "premium",
  "createdByUid": "uid_1",
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

### `orgs/{orgId}/vehicles/{vehicleId}`

`vehicleId` can remain VIN-backed when available, but should not require VIN as
the permanent identity key. A stable generated id is safer long term, with VIN
stored as an indexed attribute.

```json
{
  "vehicleId": "veh_01",
  "vin": "1HGBH41JXMN109186",
  "make": "Honda",
  "model": "Pilot",
  "year": 2022,
  "status": "active",
  "odometerMiles": 41230,
  "odometerSource": "trip_derived",
  "primaryDrivers": ["uid_1", "uid_2"],
  "homeOrgId": "abc123",
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

### `orgs/{orgId}/tripObservations/{observationId}`

One write per device-captured trip candidate.

```json
{
  "observationId": "obs_01",
  "orgId": "abc123",
  "capturedByUid": "uid_1",
  "deviceId": "ios_phone_01",
  "startedAt": "2026-06-14T13:00:00Z",
  "endedAt": "2026-06-14T13:42:00Z",
  "startLocation": { "geohash": "9v6...", "lat": 41.88, "lng": -87.63 },
  "endLocation": { "geohash": "9v7...", "lat": 41.92, "lng": -87.71 },
  "distanceMiles": 18.4,
  "durationSeconds": 2520,
  "routeFingerprint": "hash_of_simplified_polyline",
  "candidateVehicleIds": ["veh_01", "veh_02"],
  "vehicleSignals": {
    "selectedVehicleId": "veh_01",
    "bluetoothVehicleId": "veh_01",
    "carPlaySeen": true
  },
  "reconciliationStatus": "pending",
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

### `orgs/{orgId}/trips/{tripId}`

One canonical trip after merge/reconciliation.

```json
{
  "tripId": "trip_01",
  "orgId": "abc123",
  "observationIds": ["obs_01", "obs_02"],
  "startedAt": "2026-06-14T13:00:10Z",
  "endedAt": "2026-06-14T13:41:52Z",
  "distanceMiles": 18.2,
  "durationSeconds": 2502,
  "vehicleId": "veh_01",
  "vehicleAssignmentStatus": "auto_assigned",
  "vehicleAssignmentConfidence": 0.96,
  "driverUid": "uid_1",
  "driverConfidence": 0.84,
  "passengerUids": ["uid_2"],
  "tripStatus": "confirmed",
  "odometerApplied": true,
  "odometerDeltaMiles": 18.2,
  "requiresReview": false,
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

### `orgs/{orgId}/vehicleBindings/{bindingId}`

This stores learned device-to-vehicle affinity without making it authoritative.

```json
{
  "bindingId": "uid_1_ios_phone_01_veh_01",
  "uid": "uid_1",
  "deviceId": "ios_phone_01",
  "vehicleId": "veh_01",
  "bindingType": "bluetooth_or_habit",
  "confidence": 0.88,
  "lastObservedAt": "serverTimestamp",
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

## Reconciliation Flow

### Step 1: Capture

Each device writes a `tripObservation`.

Rules:

- write-only from client
- no direct mileage updates
- no direct writes to `orgs/{orgId}/trips/{tripId}`
- no direct writes to vehicle odometer from trip capture

### Step 2: Merge Candidate Detection

A backend job or function looks for observations in the same org with:

- overlapping time windows
- similar start location
- similar end location
- similar duration
- similar route fingerprint

If matched, they are grouped into one candidate trip.

### Step 3: Vehicle Assignment

The reconciler scores possible vehicles using:

- explicitly selected active vehicle in app
- Bluetooth / CarPlay / Android Auto signal
- historical device-to-vehicle binding
- who usually drives that route
- whether another household member created a matching observation
- whether another vehicle in the same org was already assigned during the same
  time window

### Step 4: Participant Assignment

Each canonical trip should track:

- likely driver
- likely passengers
- observation sources

This matters because two family members may both appear in the same trip, but
only one vehicle should receive the mileage.

### Step 5: Review Queue

If vehicle confidence is below a threshold, create a review item.

Suggested thresholds:

- `>= 0.90`: auto-assign
- `0.65 - 0.89`: assign but mark reversible
- `< 0.65`: hold for review and do not apply mileage automatically

## Product Rules

### Trip Statuses

- `pending_merge`
- `auto_assigned`
- `needs_review`
- `confirmed`
- `reassigned`
- `ignored`

### Vehicle Assignment Rules

- one canonical trip maps to exactly one vehicle
- many observations can map to one canonical trip
- many users can be participants in one canonical trip
- only confirmed or high-confidence trips update odometer-derived metrics

### Editability

Users should be able to:

- merge duplicate trips
- split one incorrectly merged trip
- reassign a trip to another vehicle
- mark themselves as passenger rather than driver
- bulk-confirm recurring commute behavior

Every correction should leave an audit trail.

## Critical Edge Cases

The system must explicitly handle:

- two household members in the same vehicle on the same trip
- two household vehicles leaving the same home at nearly the same time
- one user carrying two phones
- a user forgetting to switch the selected vehicle
- a driver handoff during a long trip
- a passenger device collecting better telemetry than the driver's device
- a vehicle transferred into a household after prior trip history exists in a
  personal org

## Migration Strategy

### Phase 0: Keep Existing Paths Working

Do not immediately delete or rewrite `users/{uid}/vehicles/{vin}`.

Instead:

- continue supporting existing personal-garage flows
- add household-aware writes in parallel
- use existing `orgs/{orgId}` memberships as the routing key

### Phase 1: Introduce Org-Owned Vehicles

Add `orgs/{orgId}/vehicles/{vehicleId}` and start reading from that path for
new household-enabled flows.

Short-term compatibility options:

- mirror vehicle writes to both user and org paths
- or store only in org path and expose a compatibility adapter in web/mobile

The cleaner long-term direction is org-owned vehicles plus a compatibility
service layer.

### Phase 2: Introduce Trip Observations and Canonical Trips

Add:

- `orgs/{orgId}/tripObservations`
- `orgs/{orgId}/trips`
- background reconciliation
- review queue

At this phase, trip telemetry still augments maintenance intelligence but does
not yet become the sole source of truth for mileage.

### Phase 3: Derived Odometer and Maintenance Signals

Once reconciliation is stable:

- derive mileage deltas from canonical trips
- surface confidence and correction UX
- feed trip-derived usage into maintenance forecasting

This is where the telemetry starts creating visible user value.

### Phase 4: Remove Single-Owner Assumptions

Refactor these areas away from user-owned vehicle assumptions:

- mobile Firestore vehicle collection access
- web storage paths
- functions reminder and maintenance readers
- account consolidation semantics
- vehicle transfer semantics

Vehicle transfer should evolve into org reassignment or member permission
changes rather than physically moving a vehicle document between user accounts.

## API and Service Changes

### Functions

Add new callable / trigger responsibilities:

- `submitTripObservation`
- `reconcileTripObservations`
- `confirmTripAssignment`
- `reassignTripVehicle`
- `mergeTrips`
- `splitTrip`

### Shared Service Layer

The web and mobile Firestore services should stop assuming the current user's
vehicles live only at `users/{uid}/vehicles`.

Introduce a shared resolver:

- resolve active org
- load org vehicles
- load canonical trips
- write review actions

## Security Model

Enforce org-scoped access:

- only active org members can read org vehicles and trips
- only authorized members can confirm or reassign trips
- clients can create observations only for orgs they belong to
- canonical trip writes should be backend-controlled

This is especially important because trip telemetry is more privacy-sensitive
than maintenance records alone.

## Telemetry-Derived Value

Once the model is correct, telemetry can power:

- more accurate mileage updates
- better maintenance due predictions
- usage-based maintenance intervals
- vehicle utilization trends by household
- driver-specific insights without corrupting vehicle-level history

The main point is that analytics value depends on attribution quality. If trip
attribution is wrong, every downstream insight becomes untrustworthy.

## Recommended First Delivery Slice

Build the smallest useful slice in this order:

1. add `household` org type and org-owned vehicles
2. add trip observation ingestion only
3. add backend merge into canonical trips
4. add manual review UI for low-confidence assignments
5. apply mileage only from confirmed canonical trips

That sequence creates a safe path to telemetry without corrupting maintenance
history early.

## Success Metrics

Track these operational metrics from day one:

- duplicate observation merge rate
- auto-assignment accuracy
- percent of trips requiring manual review
- trip reassignment rate after auto-assignment
- odometer correction rate
- number of household trips with multiple participants

If the review and reassignment rates stay high, the vehicle-assignment model is
not reliable enough to drive maintenance forecasting automatically.
