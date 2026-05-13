# Staging to Production Promotion Runbook

This runbook defines the repeatable process for promoting changes from `staging` to `production` safely.

## Scope

- Promote setup/config and validated application code.
- Do **not** migrate live environment data between environments.
- Keep environment-specific secrets in GitHub Secrets (not in git).

## Policy Baseline

- Branch model:
  - `develop`: integration and active evolution.
  - `staging`: beta validation candidate.
  - `production`: release branch.
- Data boundary:
  - Allowed: rules, indexes, functions, hosting/web assets, app code.
  - Prohibited: Firestore data import/export between environments.
- CI guard:
  - `scripts/ci-guard-no-data-migration.sh` blocks data migration commands in pipeline workflows.

## Promotion Checklist

1. Confirm branch parity intent:
   - `staging` should contain all required `develop` commits intended for release.
   - Any extra commits on `staging` must be intentional and documented.
2. Confirm staging pipeline status:
   - Latest `staging` run is green (especially Deploy Firebase).
3. Confirm production secret readiness:
   - Required production Firebase/App secrets exist in repository secrets.
4. Confirm release notes/change log:
   - Capture key commits and changed files from `staging` relative to `develop`.
5. Execute promotion:
   - Merge/cherry-pick validated `staging` content into production branch according to release policy.
6. Post-deploy verification:
   - Confirm production workflow success.
   - Smoke test critical flows (auth, vehicle CRUD, reminders, attachments).

## Automation

Use the report generator before every promotion:

```bash
bash scripts/staging-production-readiness-report.sh
```

It creates a markdown report in `artifacts/release/` containing:

- Branch ahead/behind counts
- Commit deltas (`develop..staging` and `staging..develop`)
- Changed file summary
- Latest staging run summary and failed jobs (if any)
- Required secret-name presence checks
- A final go/no-go recommendation

## Decision Rule

- **GO** only when:
  - `staging` run is successful,
  - no critical branch divergence concerns,
  - required production secret names are present,
  - no open blocking issues.
- Otherwise: **NO-GO**, fix blockers in `staging`, rerun report, then re-evaluate.
