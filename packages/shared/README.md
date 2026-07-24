# `@vehicle-vitals/shared`

Last verified: July 20, 2026

Shared domain calculations, tolerant data parsing, and Firestore path/service
helpers for the web app and private Functions companion.

## Exports

- base types and default vehicle/maintenance shapes;
- vehicle health and portfolio calculations;
- maintenance schedules;
- ownership insights;
- VIN validation;
- document-analysis summaries;
- currency helpers;
- personal and organization-scoped Firestore service factory.

Use the explicit package subpath exports declared in `package.json`. Build
output is written to `dist` and is consumed by the web app and vendored into the
private Functions companion during deployment.

## Commands

```bash
npm --workspace=@vehicle-vitals/shared run check
npm --workspace=@vehicle-vitals/shared run test
npm --workspace=@vehicle-vitals/shared run build
```

Add regression tests for calculation/data-integrity changes and separate tests
for personal versus org-scoped Firestore routing.
