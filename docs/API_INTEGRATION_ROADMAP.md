# Vehicle Vitals API Integration Roadmap

**Version**: 1.0  
**Last Updated**: March 10, 2026  
**Status**: Living reference; partially implemented and actively maintained

---

## Goal

Define a single backend API surface for both web and mobile so we can deliver:

- VIN lookup and vehicle enrichment
- owner manual discovery/access
- warranty coverage visibility
- maintenance schedule generation
- calendar event sync (Google/Apple/ICS)

This roadmap assumes Firebase Functions as the API gateway layer.

As of May 2026, the API surface already includes VIN lookup, calendar sync, owner manuals, warranty summaries, maintenance planning, premium verification, subscription checkout, Zapier webhook handling, and enterprise support callables.

---

## Current Capability Snapshot (Code-Verified)

| Capability                         | Current State        | Evidence                                                                                                                                                                                                                                                                   |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| VIN lookup backend                 | Partial, implemented | `packages/functions/src/index.ts` (`vinLookup`)                                                                                                                                                                                                                            |
| VIN lookup web usage               | Partial, implemented | `packages/web/src/utils/vehicleService.js`                                                                                                                                                                                                                                 |
| VIN lookup mobile usage            | Partial, implemented | Callable integration in `packages/mobile/lib/screens/add_vehicle_screen.dart`                                                                                                                                                                                              |
| Reminder scheduler                 | Partial              | `checkMaintenanceReminders` in `packages/functions/src/index.ts`                                                                                                                                                                                                           |
| Reminder actions (snooze/complete) | Partial, implemented | Firestore persistence in `packages/shared/src/firestoreServiceFactory.js`                                                                                                                                                                                                  |
| Email reminder delivery            | Partial              | Function exists with provider integration in `packages/functions/src/email.provider.ts` and reminder delivery reconciliation in `packages/functions/src/index.ts`                                                                                                          |
| Calendar sync                      | Partial, implemented | `createCalendarEvent` (HTTP) + `createCalendarEventCallable` (callable) support `google`, `apple`, `ics`; clients use callable-first with auth-aware HTTP fallback in `packages/mobile/lib/services/calendar_service.dart` and `packages/web/src/utils/calendarService.js` |
| Owner manual APIs                  | Partial, implemented | `getOwnerManuals` now returns OEM portal links via `packages/functions/src/manuals.provider.ts` when feature/provider are enabled                                                                                                                                          |
| Warranty APIs                      | Partial, implemented | `getWarrantySummary` now returns heuristic coverage via `packages/functions/src/warranty.provider.ts` when feature/provider are enabled                                                                                                                                    |

---

## Target API Surface

Use Firebase HTTPS functions for a normalized API contract regardless of data provider.

### 1) VIN Lookup

- `POST /api/vehicles/vin-lookup`
- Purpose: Normalize VIN lookup output for clients.
- Backing provider: NHTSA VPIC (existing), extensible for premium providers.

Request:

```json
{
  "vin": "1HGBH41JXMN109186"
}
```

Response:

```json
{
  "success": true,
  "vehicle": {
    "vin": "1HGBH41JXMN109186",
    "year": "2002",
    "make": "HONDA",
    "model": "ACCORD",
    "trim": "EX",
    "engine": "2.3L",
    "fuelType": "Gasoline",
    "source": "vpic"
  }
}
```

### 2) Owner Manual Lookup

- `GET /api/vehicles/{vin}/manuals`
- Purpose: Return available owner manuals and links for vehicle/year/trim.
- Backing provider: provider abstraction (OEM/manual aggregator).

Response:

```json
{
  "success": true,
  "manuals": [
    {
      "id": "manual-2020-honda-civic-en",
      "title": "2020 Honda Civic Owner's Manual",
      "language": "en",
      "format": "pdf",
      "url": "https://...",
      "publishedYear": 2020,
      "source": "provider_x"
    }
  ]
}
```

### 3) Warranty Summary

- `GET /api/vehicles/{vin}/warranty`
- Purpose: Return current warranty status and coverage windows.
- Backing provider: provider abstraction + user-entered fallback.

Response:

```json
{
  "success": true,
  "warranty": {
    "status": "active",
    "asOf": "2026-03-10",
    "coverages": [
      {
        "type": "powertrain",
        "startDate": "2021-02-10",
        "endDate": "2026-02-10",
        "maxMileage": 60000,
        "remainingMileage": 8200
      }
    ],
    "source": "provider_x"
  }
}
```

### 4) Maintenance Plan Generation

- `GET /api/vehicles/{vin}/maintenance-plan`
- Purpose: Return canonical schedule + next due items from mileage/date.
- Backing provider: external schedule provider where available, static fallback.

Query params:

- `currentMileage` (required)
- `timezone` (optional)

Response:

```json
{
  "success": true,
  "plan": {
    "strategy": "manufacturer_or_fallback",
    "items": [
      {
        "serviceType": "oil_change",
        "intervalMiles": 5000,
        "intervalMonths": 6,
        "nextDueMileage": 55000,
        "nextDueDate": "2026-06-01"
      }
    ]
  }
}
```

### 5) Calendar Event Sync

- `POST /api/calendar/events`
- Purpose: Create a maintenance event in chosen calendar target.
- Targets: `google`, `apple`, `ics`.

Request:

```json
{
  "vehicleVin": "1HGBH41JXMN109186",
  "title": "Oil Change",
  "description": "Vehicle Vitals maintenance reminder",
  "startAt": "2026-06-01T16:00:00Z",
  "endAt": "2026-06-01T17:00:00Z",
  "target": "ics"
}
```

Response:

```json
{
  "success": true,
  "event": {
    "target": "ics",
    "downloadUrl": "https://.../event.ics"
  }
}
```

---

## Provider Abstraction Design

Create provider interfaces in Functions so clients never call third-party APIs directly.

```ts
interface VehicleDataProvider {
  lookupVin(vin: string): Promise<VehicleLookupResult>;
}

interface ManualProvider {
  findManuals(input: VehicleIdentity): Promise<ManualDocument[]>;
}

interface WarrantyProvider {
  getWarranty(input: VehicleIdentity): Promise<WarrantySummary | null>;
}

interface ScheduleProvider {
  getSchedule(input: VehicleIdentity): Promise<ScheduleTemplate | null>;
}

interface CalendarProvider {
  createEvent(input: CalendarEventInput): Promise<CalendarEventResult>;
}
```

Routing policy:

- Primary provider first
- Fallback provider second
- Return normalized schema with `source` and `confidence`

---

## Data Model Additions (Firestore)

- `users/{uid}/vehicles/{vin}/integrations/manuals/*`
- `users/{uid}/vehicles/{vin}/integrations/warranty/*`
- `users/{uid}/vehicles/{vin}/maintenancePlan/current`
- `users/{uid}/vehicles/{vin}/calendarLinks/*`

Common metadata fields:

- `source`
- `retrievedAt`
- `expiresAt`
- `confidence`
- `rawRef` (provider record id)

---

## Security and Compliance Requirements

- Require Firebase Auth for all new integration endpoints except optional public VIN lookup.
- Store provider API keys only in Functions secrets.
- Redact VIN in logs (only first 8 chars).
- Add endpoint rate limits and abuse controls for public routes.
- Record explicit user consent before external calendar writes.

---

## Implementation Phases

### Phase 1 (1-2 sprints)

- Normalize VIN contract in Functions and align web/mobile callers.
- Remove mobile VIN mock and call real function.
- Implement reminder action persistence (complete/snooze/dismiss).
- Implement email provider for `sendMaintenanceReminder`.

### Phase 2 (2-3 sprints)

- Add manuals provider abstraction + endpoint.
- Add warranty abstraction + endpoint.
- Add Firestore caching for manual and warranty results.

### Phase 3 (2 sprints)

- Implement calendar endpoint with ICS first.
- Add Google and Apple calendar adapters.
- Verify HTTP fallback auth behavior in production when `INTEGRATION_AUTH_REQUIRED=true` (trigger strategy alignment is complete with dedicated callable + HTTP handlers).

### Phase 4 (ongoing hardening)

- Observability dashboards for API success/failure by provider.
- SLA monitoring, retries, and fallback tuning.
- Cost controls per provider and per user tier.

---

## Definition of Done per Capability

A capability is considered done when:

- Endpoint contract is documented and versioned.
- Web and mobile both use the same backend endpoint.
- Provider errors map to stable error codes.
- Results are cached with TTL and source attribution.
- Integration has tests: unit + emulator integration + smoke.

---

## Recommended Immediate Next Tasks

Completed:

1. Add new Functions endpoints as scaffold handlers returning `501 Not Implemented` with the schemas above.
2. Replace mobile mock VIN lookup with real `vinLookup` callable integration.
3. Implement reminder lifecycle persistence in `packages/shared/src/firestoreServiceFactory.js`.
4. Implement an email provider adapter in `packages/functions/src/email.provider.ts` and wire `sendMaintenanceReminder` to use it.
5. Add integration endpoint guards in `packages/functions/src/request.guards.ts` (Firebase auth + per-endpoint rate limiting).
6. Add Functions guard tests in `packages/functions/test/request.guards.test.js` and a runnable `npm run test` script.
7. Add endpoint behavior tests for provider-enabled/disabled and auth branches in `packages/functions/test/integration.endpoints.test.js`.
8. Add provider success-path tests (mocked VPIC) in `packages/functions/test/providers.success.test.js` for manuals and warranty adapters.
9. Add endpoint-level success contract tests in `packages/functions/test/integration.endpoints.test.js` for `getOwnerManuals` and `getWarrantySummary` (`200` payload branches).
10. Align calendar trigger strategy by adding callable endpoint (`createCalendarEventCallable`) and update clients to use callable-first with HTTP fallback.
11. Add auth-header fallback tests in web (`packages/web/tests/calendarService.test.js`) and mobile HTTP fallback bearer-token forwarding.
12. Add deployed HTTP auth smoke script for calendar fallback verification (`scripts/smoke-calendar-auth.sh`) and document execution in `docs/ENVIRONMENT_SETUP.md`.
13. Add combined staging+production wrapper (`scripts/smoke-calendar-auth-all.sh`) for one-command environment verification.
14. Add token helper script (`scripts/generate-firebase-id-token.sh`) to streamline staging/prod smoke execution.
15. Add automatic timestamped evidence-log capture to `scripts/smoke-calendar-auth-all.sh`.
16. Add backend callable coverage tests for `createCalendarEventCallable` auth-required and success branches in `packages/functions/test/integration.endpoints.test.js`.
17. Add optional Firestore cache layer for manuals/warranty responses via `INTEGRATION_CACHE_ENABLED` and `INTEGRATION_CACHE_TTL_MS`.

Next:

1. Replace heuristic warranty adapter with OEM/dealer authoritative provider integration.
2. Add provider secret/config documentation for production deployment (`EMAIL_PROVIDER`, `WORKSPACE_SMTP_USER`, `WORKSPACE_SMTP_APP_PASSWORD`, manuals and warranty provider flags, auth/rate-limit/cache flags).
3. Execute `scripts/smoke-calendar-auth-all.sh` with generated staging/prod ID tokens and archive the emitted evidence log artifact.
