# Act CLI Testing Guide for Vehicle Vitals

## 🎭 Testing Workflows Locally with Act

`act` allows you to run GitHub Actions workflows locally using Docker, preventing costly failures on GitHub and enabling faster development iteration.

## 🚀 Quick Start

### 1. Prerequisites

```bash
# Install act
brew install act

# Ensure Docker Desktop is running
docker info

# Setup test secrets (safe for commits)
mkdir -p .act-secrets
cat > .act-secrets/test-secrets << EOF
FIREBASE_TOKEN=test_token
FIREBASE_SERVICE_ACCOUNT_KEY={"test": "key"}
FIREBASE_SERVICE_ACCOUNT_DEVELOPMENT={"type":"service_account","project_id":"vehicle-vitals-dev"}
FIREBASE_SERVICE_ACCOUNT_STAGING={"type":"service_account","project_id":"vehicle-vitals-staging"}
FIREBASE_SERVICE_ACCOUNT_PRODUCTION={"type":"service_account","project_id":"vehicle-vitals-prod"}
EOF

# For real testing, create real-secrets with actual values (DO NOT COMMIT)
cp .act-secrets/test-secrets .act-secrets/real-secrets
# Edit .act-secrets/real-secrets with your real Firebase credentials
```

### 2. Test Workflows

```bash
# Use the interactive script
./scripts/test-act.sh

# Or test specific workflows directly
act -W .github/workflows/ci-cd-pipeline.yml --job quality-check --container-architecture linux/amd64
```

## 🛠️ Common Commands

### Test Quality Checks

```bash
act -W .github/workflows/ci-cd-pipeline.yml \
  --job quality-check \
  --secret-file .act-secrets/test-secrets \
  --container-architecture linux/amd64
```

### Test Web Build & Deploy (Dry Run)

```bash
act -W .github/workflows/ci-cd-pipeline.yml \
  --job build-packages \
  --secret-file .act-secrets/test-secrets \
  --container-architecture linux/amd64

act -W .github/workflows/ci-cd-pipeline.yml \
  --job deploy-web \
  --secret-file .act-secrets/test-secrets \
  --container-architecture linux/amd64
```

### Test iOS Distribution

```bash
act -W .github/workflows/ios-distribution.yml \
  --job distribute-ios \
  --secret-file .act-secrets/test-secrets \
  --container-architecture linux/amd64
```

## 🔧 Troubleshooting

### Docker Image Issues (M-series Mac)

```bash
# Specify architecture explicitly
act --container-architecture linux/amd64

# Pull images manually first
docker pull catthehacker/ubuntu:act-latest
docker pull node:18
```

### Missing Secrets

```bash
# Create secrets file
mkdir -p .act-secrets
cat > .act-secrets/test-secrets << EOF
FIREBASE_TOKEN=test_token
FIREBASE_SERVICE_ACCOUNT_KEY={"test": "key"}
EOF
```

### Workflow Path Issues

```bash
# Use absolute paths
act -W /full/path/to/.github/workflows/ci-cd-pipeline.yml

# Or run from project root
cd /path/to/vehicle-vitals
act -W .github/workflows/ci-cd-pipeline.yml
```

### Job Selection

```bash
# List available jobs
act --list

# Test specific job
act -W .github/workflows/ci-cd-pipeline.yml --job quality-check
```

## 📊 Workflow Testing Strategy

### Phase 1: Individual Job Testing

```bash
# Test quality checks first
act -W .github/workflows/ci-cd-pipeline.yml --job quality-check

# Test build jobs
act -W .github/workflows/ci-cd-pipeline.yml --job build-packages

# Test deployment jobs (with dry-run)
act -W .github/workflows/ci-cd-pipeline.yml --job deploy-web
```

### Phase 2: Full Pipeline Testing

```bash
# Test complete workflow
act -W .github/workflows/ci-cd-pipeline.yml --secret-file .act-secrets/test-secrets
```

### Phase 3: Event Simulation

```bash
# Simulate push to develop
act push --secret-file .act-secrets/test-secrets

# Simulate workflow dispatch
act workflow_dispatch --secret-file .act-secrets/test-secrets
```

## 🎯 Best Practices

### 1. Test Incrementally

- Start with individual jobs
- Fix issues locally before full workflow testing
- Use dry-run mode for deployment testing

### 2. Environment Variables

```bash
# Set environment variables
act --env ENVIRONMENT=development \
    --env DRY_RUN=true \
    --secret-file .act-secrets/test-secrets
```

### 3. Mock External Services

```bash
# Use test tokens/keys that don't consume real resources
# Mock API endpoints if needed
# Use local Firebase emulator for testing
```

## 🎯 Cost-Aware Testing

```bash
# Always test locally first
./scripts/test-cicd-local.sh development true ci-cd-pipeline

# Use act for workflow logic testing
./scripts/test-act.sh

# Use safe commits to avoid unnecessary triggers
./scripts/safe-commit.sh

# Only push to main/staging when confident
git push origin staging  # Only main/staging trigger Actions now
```

## 🚨 Common Issues & Solutions

### "No such image" Error

```bash
# Pull required images
docker pull catthehacker/ubuntu:act-latest
docker pull node:18

# Or disable pulling
act --pull=false
```

### "Container architecture" Warning

```bash
# For M-series Macs
act --container-architecture linux/amd64
```

### Secrets Not Found

```bash
# Check secrets file exists
ls -la .act-secrets/test-secrets

# Verify format
cat .act-secrets/test-secrets
```

### Workflow Fails with Real Credentials

```bash
# Use test/mock credentials for local testing
# Real credentials should only be used on GitHub
```

## 📈 Testing Workflow

```
Local Development → Local Scripts → Act Testing → Safe Commit → Manual Test (develop) → Auto Deploy (main/staging)
     ↓                    ↓            ↓              ↓              ↓                      ↓
   0 minutes          0 minutes    0 minutes    0 minutes    Manual trigger          Auto trigger
```

### Development Workflow

1. **Make changes** in feature branch
2. **Test locally** with `./scripts/test-cicd-local.sh`
3. **Test workflows** with `./scripts/test-act.sh`
4. **Safe commit** with `./scripts/safe-commit.sh`
5. **Merge to develop** (no automatic triggers)
6. **Manual testing** via GitHub Actions workflow_dispatch (if needed)
7. **Merge to staging** → automatic deployment
8. **Merge to main** → automatic production deployment

## 🆘 Emergency Testing

When workflows fail on GitHub:

1. **Stop the bleeding**: Don't push more commits
2. **Local diagnosis**: Use `./scripts/test-cicd-local.sh`
3. **Act debugging**: Use `./scripts/test-act.sh`
4. **Fix locally**: Iterate until tests pass
5. **Controlled deployment**: Use workflow dispatch with dry-run
6. **Production**: Only when confident

## 📚 Resources

- [Act CLI Documentation](https://github.com/nektos/act)
- [GitHub Actions Reference](https://docs.github.com/en/actions)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)

---

**Remember**: Test locally, deploy confidently, save Actions minutes! 🎭
