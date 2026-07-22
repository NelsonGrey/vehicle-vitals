# Staging to Production Promotion Runbook

This runbook defines the repeatable process for promoting changes from `staging` to `production` safely.

Last verified: July 20, 2026

Production is the `main` branch; references to a separate `production` branch
are historical. The current release decision and latest CI evidence are in
`GO_LIVE_RUNBOOK.md`.

## Scope

- Promote setup/config and validated application code.
- Do **not** migrate live environment data between environments.
- Keep environment-specific secrets in GitHub Secrets (not in git).

## Policy Baseline

> **Current enforcement gap:** As verified July 20, 2026, `main` and `develop`
> do not enforce required reviews or status checks. `staging` requires only the
> always-running `Pipeline Summary` status, not the actual Quality Gate. Treat
> the checklist below as required manual policy until repository protection is
> corrected; see `GO_LIVE_RUNBOOK.md`.

- Branch model:
  - `develop`: integration and active evolution.
  - `staging`: beta validation candidate.
  - `main`: production release branch.
- Data boundary:
  - Allowed: rules, indexes, functions, hosting/web assets, app code.
  - Prohibited: Firestore data import/export between environments.
- CI guard:
  - `scripts/ci-guard-no-data-migration.sh` blocks data migration commands in pipeline workflows.
- Repository boundary:
  - Firebase Functions are promoted in the private
    `NelsonGrey/vehicle-vitals-functions` companion repository using matching
    `develop`, `staging`, and `main` branches.
  - The public pipeline mounts that repository at `packages/functions` during
    deployment.

## Promotion Checklist

1. Confirm branch parity intent:
   - `staging` should contain all required `develop` commits intended for release.
   - Any extra commits on `staging` must be intentional and documented.
2. Confirm staging pipeline status:
   - Latest `staging` run is green (especially Deploy Firebase).
   - Hosted staging Chromium, Firefox, and WebKit UAT results are all green.
3. Confirm production secret readiness:
   - Required production Firebase/App secrets exist in repository secrets.
   - `FUNCTIONS_REPO_PAT` can read the companion repository.
   - Required runtime secrets exist in the production Firebase project.
4. Confirm release notes/change log:
   - Capture key commits and changed files from `staging` relative to `develop`.
   - Compare branch trees as well as ahead/behind counts; squash promotions make
     commit counts noisy in this repository.
5. Execute promotion:
   - Promote the companion Functions `staging` branch to its `main` branch.
   - Confirm production branch protections now enforce the approved review and
     success-bearing workflow checks, or record explicit temporary risk
     acceptance.
   - Merge validated public `staging` content into `main` according to release policy.
6. Post-deploy verification:
   - Confirm production workflow success.
   - Smoke test critical flows (auth, vehicle CRUD, reminders, attachments).
   - Confirm `https://vehicle-vitals.com` and production security headers.

## Automation

Use the report generator before every promotion:

```bash
bash scripts/staging-production-readiness-report.sh
```

It creates a markdown report in `artifacts/release/` containing:

- Branch ahead/behind counts
- Commit deltas (`develop..staging` and `staging..develop`)
- Commit deltas (`main..staging` and `staging..main`)
- Changed file summary
- Latest staging run summary and failed jobs (if any)
- Required secret-name presence checks
- A final go/no-go recommendation

After a `GO` report, prepare (or create) the promotion PR:

```bash
bash scripts/open-staging-to-production-pr.sh
```

Create the PR automatically when ready:

```bash
bash scripts/open-staging-to-production-pr.sh --create-pr
```

The PR helper:

- Re-runs readiness generation first
- Blocks PR creation on `NO-GO`
- Generates a PR body artifact in `artifacts/release/`
- Targets `staging` -> `main` by default. Set `PRODUCTION_BRANCH=<branch>` when the release policy intentionally uses a different production branch.

## Decision Rule

- **GO** only when:
  - `staging` run is successful,
  - no critical branch divergence concerns,
  - required production secret names are present,
  - companion Functions branches are compatible,
  - the latest production-target UAT contract is understood and green,
  - no open blocking issues.
- Otherwise: **NO-GO**, fix blockers in `staging`, rerun report, then re-evaluate.
