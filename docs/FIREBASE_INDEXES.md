# Firebase Firestore Indexes

Last verified: July 20, 2026

## Source of Truth

`firestore.indexes.json` at the repository root is the only deployable index
definition. It currently contains no composite indexes or field overrides:

```json
{
  "indexes": [],
  "fieldOverrides": []
}
```

Vehicle and maintenance pagination currently use a single `orderBy` plus
`limit` (`updatedAt` descending for vehicles and `date` descending for
maintenance). Firestore's automatic single-field indexes support those query
shapes; named composite indexes described in older versions of this document
were not present in the executable index file.

## Deployment

The normal Firebase deployment includes Firestore configuration. To deploy only
indexes to a deliberately selected environment:

```bash
firebase use staging
firebase deploy --config firebase.staging.json --only firestore:indexes
```

Use `development`/`firebase.dev.json` or
`production`/`firebase.prod.json` only after confirming the target.

## Adding an Index

1. Capture the exact failing query and Firebase index requirement.
2. Add the smallest required definition to `firestore.indexes.json`.
3. Test the query against the intended emulator/project and both personal/org
   paths when applicable.
4. Deploy to development, then staging, before production.
5. Update this document and `GO_LIVE_RUNBOOK.md` if release risk changes.

Do not treat an index created only in the Firebase Console as complete; commit
the definition so every environment and future deployment can reproduce it.
