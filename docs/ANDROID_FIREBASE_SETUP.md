# Firebase Android Configuration for Vehicle-Vitals

Last reviewed: July 20, 2026

Status: **On hold.** Android source/configuration exists in the Flutter project,
but Android build and distribution are disabled in
`.cicd/projects/vehicle-vitals.yml`. Do not claim Android availability.

## Current Source Locations

- `packages/mobile/android/`: Flutter Android project.
- `packages/mobile/android/app/google-services.json`: tracked Firebase client
  configuration.
- `packages/mobile/lib/firebase_options.dart`: environment-aware Firebase
  options.
- `packages/mobile/config/{environment}/android/`: gitignored optional
  environment files represented by placeholders.

This document intentionally omits API keys, app IDs, OAuth client IDs, and
other configuration values. Verify them directly against the target Firebase
project when Android work resumes.

## Resume Checklist

1. Approve Android product/release scope.
2. Confirm package/application IDs in Firebase, Gradle, and store configuration.
3. Regenerate or download per-environment client files securely.
4. Re-enable `targets.android` in the project manifest and review workflow
   signing/distribution behavior.
5. Run analyzer/tests plus debug and signed release builds.
6. Validate Auth, Firestore, Functions, Storage, Messaging, ads, purchases,
   privacy, and account deletion on real devices.
7. Add Google Play signing, listing, data safety, purchase, review, and rollback
   evidence to `GO_LIVE_RUNBOOK.md` before public claims.

Do not run `flutter create` over the existing project merely to regenerate the
platform tree; it can overwrite configured files.
