# `@vehicle-vitals/web`

Last verified: July 20, 2026

React 18/Vite application containing the public marketing site, authentication,
and the protected Vehicle-Vitals web app.

## Stack

- React 18, React Router 7, Vite 8, Tailwind CSS 4.
- Firebase Auth, Firestore, Storage, Functions, Analytics, and Messaging.
- Vitest/Testing Library unit tests and Playwright hosted UAT.
- `@vehicle-vitals/shared` for shared domain and Firestore helpers.

## Commands

Run from the repository root:

```bash
npm ci
npm run dev:web
npm --workspace=@vehicle-vitals/web run check
npm --workspace=@vehicle-vitals/web run test:unit
npm --workspace=@vehicle-vitals/web run test:uat:chromium
npm --workspace=@vehicle-vitals/web run build:production
```

The package scripts sanitize inherited `VITE_*` variables and select the
requested development, staging, demonstration, or production environment.

## Structure

```text
src/App.tsx       route composition and environment modes
src/pages/        public, auth, app, subscription, support, and admin pages
src/components/   reusable UI, layout, navigation, ads, and product components
src/shared/       Firebase, auth, entitlements, analytics, consent, and services
src/utils/        feature-specific Firebase/callable helpers
src/data/         persona and marketing data
public/           static SEO, messaging, icons, ads, and media assets
tests/            unit and Playwright UAT tests
```

Firebase Cloud Functions are in the private companion repository. Client calls
remain here; backend source is mounted at `packages/functions` only for local or
CI backend work.

See `../../docs/DEVELOPER_GUIDE.md`, `../../docs/TESTING_INSTRUCTIONS.md`, and
`UAT_TESTING.md`.
