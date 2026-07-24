# Vehicle-Vitals Legacy Automation Helpers

Last reviewed: July 20, 2026

Status: **Legacy/supporting.** The root `automate.sh`, monitoring helpers, token
helpers, and environment scripts predate the current CI/CD design. They are not
the deployment source of truth and should not be described as zero-touch or
self-healing production automation.

Use these current sources instead:

- `.github/workflows/master-pipeline.yml` for CI/CD.
- `.cicd/projects/vehicle-vitals.yml` for target enablement.
- `docs/DEPLOY.md` for deployment.
- `docs/GO_LIVE_RUNBOOK.md` for release state and gates.
- `docs/ENVIRONMENT_SETUP.md` for environment configuration.

## What Remains in the Repository

| Helper | Intended role | Current caution |
| --- | --- | --- |
| `automate.sh` | Menu/controller for setup, deploy, monitoring, token, environment, health, and Docker actions | Several branches are scaffolded or use legacy paths; review before execution |
| `scripts/manage-environments.sh` | Environment helper | Must be reconciled with current Firebase aliases and sanitized build scripts |
| `scripts/monitoring.sh` | Local monitoring helper | Not proof of 24/7 production monitoring |
| `scripts/token-rotation.sh` and `update-tokens.sh` | Credential helper scaffolding | Never run without reviewing targets and recovery plan |
| `setup-prod-secrets.sh` | Legacy repository-secret bootstrap | Requires obsolete/unused names, assumes a nonexistent allowlist gate, and ends with an old workflow name; do not run as current setup |
| `monitoring/` and `Dockerfile.monitor` | Optional runner-monitor service | Separate from application availability monitoring |
| `setup-github-app.sh` | GitHub App setup helper | Review permissions and current GitHub configuration first |

## Known Legacy Assumptions

- `automate.sh` contains a web deploy path that changes into `web/`, while the
  current package lives at `packages/web`.
- Mobile deployment scaffolding builds both Android and iOS even though Android
  is on hold and iOS automation is currently disabled.
- Docker/backup/self-healing sections are partial scaffolding, not verified
  operational controls.
- `setup-prod-secrets.sh` does not match the active workflow secret inventory or
  current environment exposure model.
- Older copies of this document referred to a different project and claimed
  capabilities not proven by the current implementation.

## Safe Use

Before running a helper:

1. Read the complete script and every script it invokes.
2. Confirm the target environment and resolved project ID.
3. Confirm it does not print, overwrite, rotate, or delete credentials without
   an approved recovery path.
4. Prefer dry-run or read-only status modes.
5. Use `docs/DEPLOY.md` for actual application deployment.

Example read-only inspection:

```bash
bash -n automate.sh
rg -n 'firebase deploy|gh secret|docker|rm |packages/web|cd web' \
  automate.sh scripts monitoring
```

## Modernization Criteria

This helper suite should be considered active only after:

- paths and environment mappings match the current repository;
- destructive/credential operations have explicit confirmation and recovery;
- automated tests cover argument parsing and target selection;
- CI/CD behavior does not duplicate or bypass the master pipeline;
- documentation claims are backed by a successful end-to-end rehearsal.

Until then, preserve these files as operator utilities and historical context,
not as a release mechanism.
