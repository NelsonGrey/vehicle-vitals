# Demo Test Data Toolkit

Last reviewed: July 20, 2026

This toolkit provides repeatable, robust demo data load and unload workflows for Vehicle-Vitals.

The seed and purge implementations live in the private
`NelsonGrey/vehicle-vitals-functions` companion repository. Clone or mount it
at the gitignored `packages/functions` path and install its dependencies before
using the root scripts below. The JSON dataset in this public repository is
only input data.

## Prerequisites

- The private Functions companion mounted at `packages/functions`.
- Firebase Admin credentials available to the Functions Node runtime.
- One Firebase Auth user UID to seed data into.
- Optional: FIREBASE_PROJECT_ID if not inferred by credentials.

## Seed Demo Data

Run from repository root:

npm run demo-data:load -- --uid=<firebase-auth-uid>

Optional custom data file:

npm run demo-data:load -- --uid=<firebase-auth-uid> --file=scripts/test-data/demo-data.json

## Purge Demo Data

Run from repository root:

npm run demo-data:purge -- --uid=<firebase-auth-uid> --force

This recursively deletes:

- users/<uid>/vehicles/\*
- users/<uid>/vehicles/_/maintenance/_
- users/<uid>/vehicles/_/reminders/_
- users/<uid>/\_meta/demoSeed

## Dataset File

Default dataset file:

scripts/test-data/demo-data.json

Schema summary:

- dataset: string name/version
- vehicles: array
- vehicle fields: vin, make, model, year, mileage, recall and profile fields
- maintenance: array per vehicle
- reminders: array per vehicle

## Safety Notes

- Purge requires `--force`.
- Data is scoped to a single UID so demos do not affect other user accounts.
- Verify the active Firebase project before seeding or purging; these commands
  mutate backend data and are not safe dry runs.
