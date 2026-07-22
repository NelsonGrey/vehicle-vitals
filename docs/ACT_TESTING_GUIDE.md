# Testing the Workflow with `act`

Last reviewed: July 20, 2026

`act` can inspect and partially exercise Linux GitHub Actions jobs in
`.github/workflows/master-pipeline.yml`. It is not release evidence and cannot
reproduce hosted environment URLs, GitHub permissions and protections, the
private Functions checkout, Firebase deployment identity, or macOS/iOS jobs.

## Prerequisites

- Docker is installed and running.
- `act` is installed (`brew install act` on macOS).
- The command is run from the repository root.

List the jobs and resolved event graph before attempting a run:

```bash
act --list -W .github/workflows/master-pipeline.yml
```

## Safe Scope

Use `act` only for a focused, non-deployment Linux job whose actions support the
local runner. For example, you may attempt the test job with explicitly fake
configuration:

```bash
act pull_request \
  -W .github/workflows/master-pipeline.yml \
  --job test \
  --container-architecture linux/amd64
```

Expect differences from GitHub-hosted runners. Run the repository's native
commands first; they are faster and more diagnostic:

```bash
npm ci
npm run check
npm run test:unit:all
npm run test:scripts
npm run build:web
```

## Do Not Use `act` For

- `deploy-firebase` with real credentials.
- Proof that a hosted Firebase deployment works.
- The `build-ios` macOS/signing path.
- Branch-protection, environment-approval, or secret-availability validation.
- Hosted Playwright UAT evidence.

The legacy `scripts/test-act.sh` and `scripts/test-cicd-local.sh` contain older
job names, mock secret shapes, and assumptions. Review them before use; they are
not the current source of truth. The former standalone
`ios-distribution.yml` workflow no longer exists.

## Secrets

Never commit an `.act-secrets` file containing real values. Prefer running
non-secret local package commands. If a focused workflow simulation genuinely
requires placeholders, use a gitignored file with nonfunctional values and
remove it after the test. A local placeholder cannot validate real credential
scope or Firebase access.

## Troubleshooting

- If Docker architecture differs on Apple silicon, add
  `--container-architecture linux/amd64`.
- If an action or service is unsupported, run its underlying repository command
  directly.
- If a job depends on prior job outputs, hosted services, or private checkout,
  stop the local simulation and use a pull-request run.

See `TESTING_INSTRUCTIONS.md` for the authoritative test matrix and
`COST_EFFECTIVE_CICD.md` for current cost-control guidance.
