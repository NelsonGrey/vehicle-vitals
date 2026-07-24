# Vehicle Vitals Repository Notes for Coding Assistants

Last reviewed: July 20, 2026

This file is retained as a repository note under `docs/`; it is not an active
GitHub Copilot instruction file. Use `docs/README.md` to locate canonical
documentation and inspect source before editing.

## Repository Shape

- `packages/web`: React 19, TypeScript, Vite, React Router, Vitest, and
  Playwright.
- `packages/mobile`: Flutter/Dart mobile client using `go_router` and Provider.
- `packages/shared`: shared JavaScript/TypeScript calculations, types, and data
  helpers.
- `packages/firebase-utils`: reusable Firebase utilities.
- `firebase/`, `firebase*.json`, and `firestore.indexes.json`: public rules,
  Hosting, emulator, and index configuration.
- `packages/functions`: gitignored mount point for the private
  `NelsonGrey/vehicle-vitals-functions` companion checkout; it is not tracked in
  this repository.

There is no active Data Connect or React Native application in this repository.

## Sources of Truth

- Web routes: `packages/web/src/App.tsx`
- Mobile routes: `packages/mobile/lib/main.dart`
- Capability names: `packages/web/src/data/capabilities.ts` and
  `packages/mobile/lib/data/capabilities.dart`
- Web Firebase setup: `packages/web/src/shared/firebaseConfig.ts`
- Firestore and Storage authorization: `firebase/firestore.rules` and
  `firebase/storage.rules`
- CI/CD: `.github/workflows/master-pipeline.yml`
- Release status: `docs/GO_LIVE_RUNBOOK.md`

## Working Rules

- Preserve VIN-based vehicle document IDs and existing user/organization path
  routing unless a migration is explicitly designed.
- Keep authorization enforced in rules and callable handlers; UI visibility is
  not an authorization boundary.
- Do not expose Functions runtime secrets in Vite variables or public docs.
- Maintain web/mobile capability-label parity and update its contract test when
  the model changes.
- Preserve backward-compatible route redirects when consolidating pages.
- Treat compact laptop height as a first-class web responsive target.
- Run the relevant commands in `docs/TESTING_INSTRUCTIONS.md` before handoff.

Do not infer shipped status from planning documents. When source and docs
disagree, source wins and the owning canonical document must be updated.
