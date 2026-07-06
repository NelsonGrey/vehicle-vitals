<!--
Concise guidance for automated coding agents working on Vehicle Vitals.
Only include repository-discoverable facts and file pointers; keep edits minimal and follow existing patterns.
-->

# Vehicle Vitals — Copilot instructions

Two frontends (web + mobile) share Firebase-backed utilities in `shared/`. Follow the existing data paths, auth checks, and service wiring.

- Architecture (big picture)
  - Web: React + Vite + react-router. Entry: `web/src/main.jsx` → `web/src/App.jsx`. Pages in `web/src/pages/*` (Home, AddVehicle, EditVehicle, etc.).
  - Mobile: Flutter + go_router + Provider. Entry: `mobile/lib/main.dart`. Screens in `mobile/lib/screens/*.dart` (HomeScreen, AddVehicleScreen, EditVehicleScreen, ScanVINScreen, MaintenanceListScreen, MaintenanceDetailScreen, AccountScreen, etc.). Package names: com.nelsongrey.vehiclevitals.app.android (Android), com.nelsongrey.vehiclevitals.app.ios (iOS).
  - Shared: `shared/*` holds platform-agnostic Firebase config, a Firestore service factory, and reusable types. Flutter app has equivalent Dart services and models in `mobile/lib/services/` and `mobile/lib/models/`.
  - DataConnect: GraphQL config in `dataconnect/` with generated clients vendored under `src/dataconnect-generated` and `web/src/dataconnect-generated`. These are consumed via the local dep `@dataconnect/generated` in web `package.json`. Do not edit generated code; update schema in `dataconnect/schema/schema.gql` if needed.

- Data model and Firestore paths
  - Vehicles are keyed by VIN: `users/${userId}/vehicles/${vin}`.
  - Use `shared/types.js` `defaultVehicle` when constructing vehicles (fields include make, model, year, vin, mileage, purchaseDate, nextDue\*).
  - Maintenance subcollection: `users/${userId}/vehicles/${vin}/maintenance/*`.
  - Timestamps: writes stamp `createdAt/updatedAt` via `serverTimestamp()` in the factory. Prefer factory helpers over ad‑hoc Firestore calls to keep stamps consistent.
  - Auth pattern: reads return `[]`/`null` when unauthenticated; writes throw `Error('Not authenticated')`. See `shared/firestoreServiceFactory.js`.

- Firebase initialization boundaries
  - Web app config lives in `web/src/shared/firebaseConfig.js` (reads `import.meta.env`). Some utilities (e.g., `web/src/utils/vehicleService.js`) import `auth/db` directly from here.
  - Cross-platform factory wiring for web: `web/src/shared/firestoreService.js` builds a service via `createFirestoreService` from `shared/firestoreServiceFactory.js` using the web app’s `auth/db`.
  - Mobile uses `shared/firestoreClient.js` (Expo) to initialize `auth` (RN persistence), `db`, and a factory-built `firestoreService`.
  - Do NOT import web-only modules into mobile bundles. `shared/firebaseConfig.js` is process/env + Expo aware and safe to import from native, but web should use its own config file.
  - Dev auth: `web/src/shared/devAuth.js` signs in anonymously in Vite dev to enable local writes.

- Key workflows (concrete commands)
  - Web (from `web/`): `npm run dev`, `npm run build`, `npm run preview`, `npm run test` (Vitest). From repo root, you can prefix with `--prefix web`.
  - Mobile (from `packages/mobile/`): `flutter run`, `flutter run -d ios`. Android runtime/deployment is currently on hold. `ScanVINScreen` uses `mobile_scanner` package with Code39/Code128 support.
  - Root scripts: `npm run export:logo` renders assets via `scripts/export-logo.js`.
  - Tests: `web/tests/firestoreService.test.js` uses Vitest + `@firebase/rules-unit-testing`; it `vi.mock`s `shared/firebaseConfig` so the service uses a test DB.

- Integration points
  - VIN lookup: `web/src/utils/vehicleService.js` `fetchVehicleByVINAndSave(vin)` calls NHTSA VPIC, then writes to `users/${uid}/vehicles/${vin}` (web-config path).

- Editing rules (project-specific)
  - Preserve Firestore document paths and the VIN-as-id convention (vehicles and maintenance).
  - Prefer factory helpers from `shared/firestoreServiceFactory.js` to keep auth gating and timestamps consistent.
  - Gate all Firestore writes on `auth.currentUser?.uid` and maintain read-vs-write unauth behavior.
  - Reminder helpers in the factory are stubs (no Firestore writes yet); keep paths under `users/${uid}/vehicles/${vin}/reminders/*` if implementing.

- Files to open first (good exemplars)
  - `web/src/pages/Home.jsx` — lists vehicles, calls `getVehicles`/`deleteVehicle`.
  - `web/src/pages/AddVehicle.jsx` — constructs from `defaultVehicle`, uses `addOrUpdateVehicle`.
  - `web/src/pages/EditVehicle.jsx` — updates vehicle + lists maintenance via factory helpers.
  - `shared/firestoreServiceFactory.js`, `shared/firestoreClient.js`, `web/src/shared/firestoreService.js` — service wiring patterns.

If anything is unclear (e.g., which Firebase config to import in a new module or how to regenerate DataConnect clients), ask and we’ll inspect callers or scripts to clarify.

## Regenerating DataConnect clients

- Edit schema: update GraphQL in `dataconnect/schema/schema.gql` (and any connector operations under `dataconnect/example/*.gql`).
- Confirm generator config: see `dataconnect/example/connector.yaml` — outputs are configured for:
  - `src/dataconnect-generated` (shared, non-React)
  - `web/src/dataconnect-generated` (React helpers)
- Run the generator: use the Firebase Data Connect codegen (e.g., via Firebase CLI or your IDE integration) pointed at `dataconnect/dataconnect.yaml`. Ensure the local package alias `@dataconnect/generated` in each `package.json` continues to point to the correct generated folder.
- Do not hand-edit generated files. If changes are needed, update the schema/operations and regenerate.

### Emulator note (optional)

- To test DataConnect locally, instrument your client to use the emulator host/port. Example:
  - Web/Shared: `connectDataConnectEmulator(getDataConnect(connectorConfig), 'localhost', 9399)`.
  - See the generated READMEs in `src/dataconnect-generated` and `web/src/dataconnect-generated` for usage.

## Environment variables (web + mobile)

- Web (Vite): Firebase configuration is handled through environment variables set in CI/CD pipelines. The web config in `web/src/shared/firebaseConfig.js` reads `import.meta.env`.
- Mobile (Flutter): Firebase configuration is handled through `mobile/lib/firebase_options.dart` (generated by FlutterFire CLI). Run `flutterfire configure` to set up Firebase for the Flutter app.
