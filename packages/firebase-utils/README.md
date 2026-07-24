# `@shared/firebase-utils`

Last verified: July 20, 2026

TypeScript Firebase SDK helper package used by the Vehicle-Vitals workspace.
It provides a `FirebaseClient` abstraction for authentication, Firestore CRUD,
callable Functions, Storage, and emulator setup.

This package is supporting infrastructure, not the product domain model.
Product-specific calculations and garage routing belong in
`@vehicle-vitals/shared`; privileged business logic belongs in the private
Functions companion.

## Commands

```bash
npm --workspace=@shared/firebase-utils run check
npm --workspace=@shared/firebase-utils run build
npm --workspace=@shared/firebase-utils run test
```

The package exports ESM from `dist`. Never embed real Firebase Admin credentials
or service-account values in examples, tests, or committed configuration.
