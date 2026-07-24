# Firestore Monetization Rules

Last verified: July 20, 2026

This document explains the security intent for subscription, quota,
entitlement, organization-finance, and compliance data. It is not a rules
snippet and must not be deployed or pasted into Firebase.

The only executable Firestore rules source is:

```text
firebase/firestore.rules
```

Deploy through the master pipeline or with the appropriate environment config,
as described in `DEPLOY.md`.

## Current Rule Intent

### User subscription and quota data

- A signed-in user may read their own `users/{uid}/subscription/*` and
  `users/{uid}/quotas/*` documents.
- Clients may not write subscription or quota documents.
- The broad user-owned document rule explicitly carves out `subscription` and
  `quotas` so a modified client cannot self-upgrade or grant unlimited quota.
- Trusted backend code writes these documents through the Firebase Admin SDK,
  which does not rely on client Firestore rules.

### Organization data

- Active organization members may read their organization.
- Organization membership, audit, compliance, invoice, and payable documents
  are server-managed.
- Organization vehicle writes are allowed to active members except the
  `read_only` role.
- Billing-sensitive finance reads are limited to owner/admin/billing roles.

### Compliance and idempotency

- Users may read their own compliance request records.
- Clients cannot create, update, or delete compliance request lifecycle state.
- Idempotency keys are never client-readable or client-writable.

### Public launch forms

- Anonymous launch signup and suggestion creation is schema-constrained.
- Public reads are denied.
- Email, source, suggestion length, exact key sets, and timestamp types are
  validated in rules.

## Backend Ownership

The server-authoritative implementation lives in the private companion
repository `NelsonGrey/vehicle-vitals-functions`, mounted as
`packages/functions` for local work and CI deployment. References elsewhere to
Functions callables or provider files refer to that checkout.

## Validation

At minimum, verify:

1. An unauthenticated user cannot read private collections.
2. A user can read but cannot write their subscription and quota documents.
3. One user cannot access another user's data.
4. Org members can read org data; `read_only` members cannot mutate vehicles.
5. Non-members cannot access org data.
6. Finance documents require a billing-capable role.
7. Compliance and idempotency lifecycle state rejects client writes.
8. Public launch forms accept only the exact valid schema and deny reads.

Use Firebase Rules unit tests and emulator-backed integration tests. A rules
file that merely loads successfully is not sufficient behavioral evidence.

## Change Rule

Any monetization data-model change must update, in one reviewed change set:

- `firebase/firestore.rules`;
- relevant emulator tests;
- client read/write paths;
- private companion backend behavior;
- `API_DATA_MODELS.md` when the contract changes;
- `GO_LIVE_RUNBOOK.md` when release risk changes.
