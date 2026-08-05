# Demo Test Data Toolkit

This toolkit provides repeatable, robust demo data load and unload workflows for Vehicle-Vitals.

## Prerequisites

- Firebase Admin credentials available to Node runtime.
- One Firebase Auth user UID to seed data into.
- Optional: FIREBASE_PROJECT_ID if not inferred by credentials.

## Seed Demo Data

Run from repository root:

npm --workspace=functions run seed:demo-data -- --uid=<firebase-auth-uid>

Optional custom data file:

npm --workspace=functions run seed:demo-data -- --uid=<firebase-auth-uid> --file=scripts/test-data/demo-data.json

## Purge Demo Data

Run from repository root:

npm --workspace=functions run purge:demo-data -- --uid=<firebase-auth-uid> --force

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

- Purge requires --force.
- Data is scoped to a single UID so demos do not affect other user accounts.
