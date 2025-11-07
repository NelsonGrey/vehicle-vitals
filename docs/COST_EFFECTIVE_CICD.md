# Cost-Effective CI/CD Testing Strategy for Vehicle Vitals

## 🎯 Overview

This guide outlines a cost-effective approach to CI/CD testing that minimizes GitHub Actions usage while maintaining robust deployment pipelines. By leveraging local testing tools and act CLI, we can significantly reduce costs while improving development velocity.

## 💰 Cost Analysis

### GitHub Actions Pricing (as of 2025)

- **Free tier**: 2,000 minutes/month
- **Paid tier**: $0.008/minute (approximately $5.76/hour)
- **macOS runners**: $0.08/minute (approximately $57.60/hour)

### Current Workflow Costs

| Workflow             | Trigger                         | Estimated Cost  | Frequency |
| -------------------- | ------------------------------- | --------------- | --------- |
| CI/CD Pipeline       | Push/PR to main/staging/develop | $2-5 per run    | Daily     |
| Android Distribution | Push to main/staging/develop    | $5-10 per run   | Daily     |
| iOS Distribution     | Push to main/staging/develop    | $10-20 per run  | Daily     |
| **Total Monthly**    |                                 | **$500-1,000+** |           |

_Note: Local testing with act CLI reduces unnecessary GitHub Actions runs and provides immediate feedback_

## 🧪 Testing Strategies

### 1. Local Script Testing (0 Actions minutes)

```bash
# Test complete pipeline locally
./scripts/test-cicd-local.sh development

# Interactive testing menu
./scripts/test-act.sh development true ci-cd-pipeline
```

### 2. Act CLI Testing (0 Actions minutes)

```bash
# Interactive act testing
./scripts/test-act.sh

# Test specific jobs
act -W .github/workflows/ci-cd-pipeline.yml --job quality-check --container-architecture linux/amd64
```

### 3. GitHub Dry-Run Testing (Minimal Actions minutes)

- Use workflow dispatch with `dry_run: true`
- Include `[DRY-RUN]` in commit messages
- Only triggers on main/staging branches

### 4. Production Deployment (Full Actions minutes)

- Reserved for actual releases
- Push to main/staging branches
- Full deployment execution

## 📊 Cost Savings

| Method        | Actions Minutes Used | Deployment Cost | Use Case               |
| ------------- | -------------------- | --------------- | ---------------------- |
| Local Scripts | 0                    | $0              | Development testing    |
| act CLI       | 0                    | $0              | Workflow logic testing |
| Dry-Run Push  | Yes (reduced)        | $0              | Integration testing    |
| Live Push     | Yes                  | Full cost       | Production deployment  |

## 🏃 Quick Commands

```bash
# Local pipeline test
./scripts/test-cicd-local.sh development

# act workflow test
./scripts/test-act.sh

# Safe commit with menu (recommended)
./scripts/safe-commit.sh

# Dry-run commit
git commit -m "test: add new feature [DRY-RUN]"

# Live deployment
git commit -m "feat: add new feature"
```

## 🔒 Safe Commit Types

### Production Commits (trigger GitHub Actions on main/staging)

- `feat:` - New features
- `fix:` - Bug fixes
- `perf:` - Performance improvements
- `refactor:` - Code refactoring
- `style:` - Code style changes
- `test:` - Adding/modifying tests
- `ci:` - CI/CD changes
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks

### Development Commits (safe, no Actions trigger)

- `feat/wip:` - Work in progress features [SAFE]
- `experiment:` - Experimental changes [SAFE]
- `spike:` - Investigation/spike [SAFE]
- `draft:` - Draft implementation [SAFE]

### Testing Commits (minimal Actions usage)

- `test:` with `[DRY-RUN]` - Test deployment logic
- `deploy:` with `[TEST-DEPLOY]` - Test deploy to dev environment

## 🔧 Setup Requirements

1. **act CLI**: `brew install act`
2. **Docker Desktop**: For running containers locally
3. **Firebase CLI**: `npm install -g firebase-tools` (optional)

## 📝 Best Practices

- **Test locally first**: Always run local tests before pushing
- **Use dry-run commits**: Include `[DRY-RUN]` for integration testing
- **Batch changes**: Group multiple changes in single commits
- **Monitor usage**: Check GitHub Actions usage regularly
- **Reserve minutes**: Save Actions minutes for actual deployments

## 🎭 Act CLI Configuration

### Optimized Docker Images

```bash
# One-time setup for faster testing
./scripts/test-act.sh  # Select option 7: Setup Docker Images
```

### Test Secrets Management

```bash
# Safe test secrets (can be committed)
.act-secrets/test-secrets

# Real secrets (DO NOT COMMIT)
.act-secrets/real-secrets  # Create locally for real testing
```

### Workflow-Specific Testing

```bash
# Test quality checks only
act -W .github/workflows/ci-cd-pipeline.yml --job quality-check

# Test build process
act -W .github/workflows/ci-cd-pipeline.yml --job build-packages

# Test deployment (dry-run)
act -W .github/workflows/ci-cd-pipeline.yml --job deploy-web
```

## 🚀 Deployment Workflow

### Development Phase (Local Testing First)

```bash
# 1. Local testing (0 minutes)
./scripts/test-cicd-local.sh development

# 2. Act testing (0 minutes)
./scripts/test-act.sh

# 3. Safe commit to develop (no automatic triggers)
./scripts/safe-commit.sh  # Choose safe commit type

# 4. Optional: Manual testing on develop via workflow_dispatch
# Go to GitHub Actions → Select workflow → Run workflow
```

### Staging Phase

```bash
# 1. Test staging deployment locally
./scripts/test-cicd-local.sh staging

# 2. Merge develop to staging (triggers automatic deployment)
git checkout staging
git merge develop
git push origin staging
```

### Production Phase

```bash
# 1. Final testing
./scripts/test-cicd-local.sh production

# 2. Merge staging to main (triggers automatic production deployment)
git checkout main
git merge staging
git push origin main
```

### Dry-Run Testing

```bash
# Test deployment logic without actual deployment
./scripts/safe-commit.sh  # Choose "14. dry-run" option
git push origin staging   # Will build but skip actual deployment
```

## 📊 Monitoring & Optimization

### GitHub Actions Usage

- Check usage at: https://github.com/settings/billing
- Monitor workflow run times
- Identify and optimize slow jobs

### Cost Reduction Techniques

```bash
# Use matrix builds efficiently
# Cache dependencies
# Use smaller runner images
# Parallelize independent jobs
```

### Performance Optimization

```bash
# Local build time testing
time npm run build

# Bundle size monitoring
npm run build && du -sh packages/web/dist/

# Test performance
npm run test -- --coverage
```

## 🚨 Emergency Procedures

### When Workflows Fail on GitHub

1. **Immediate**: Stop pushing commits to avoid wasting minutes
2. **Diagnose**: Run `./scripts/test-cicd-local.sh` locally
3. **Debug**: Use `./scripts/test-act.sh` for workflow debugging
4. **Fix**: Iterate locally until tests pass
5. **Deploy**: Use dry-run first, then controlled deployment

### Cost Control

- Set up billing alerts in GitHub
- Use branch protection rules to require reviews
- Implement mandatory local testing before merges

## 📈 Success Metrics

### Cost Reduction Goals

- **Target**: 50-70% reduction in Actions minutes through local testing
- **Strategy**: Use act CLI for development validation, reserve GitHub Actions for actual deployments
- **Current**: ~500 minutes/month (with local testing adoption)
- **Goal**: <250 minutes/month (through reduced unnecessary runs)

### Quality Improvements

- **Faster feedback**: Local testing provides immediate results
- **Higher confidence**: Multiple testing layers catch issues early
- **Better collaboration**: Developers can test changes locally

## 🔗 Integration with Existing Workflows

### Modified Triggers

```yaml
# Only main and staging branches trigger workflows automatically
on:
  push:
    branches: [main, staging] # develop excluded for cost savings
  pull_request:
    branches: [main, staging]
  workflow_dispatch: # Manual testing available
```

### Branch-Based Deployment

- **main branch**: Production deployment 🚀
- **staging branch**: Staging deployment 🧪
- **develop branch**: No automatic triggers 💰 (use workflow_dispatch for manual testing)

### Environment-Specific Secrets

- **Development**: Test values only
- **Staging**: Real credentials (controlled access)
- **Production**: Real credentials (restricted access)

## 📚 Additional Resources

- [act CLI Documentation](https://github.com/nektos/act)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [GitHub Actions Billing](https://docs.github.com/en/billing/managing-billing-for-github-actions/about-billing-for-github-actions)

---

**Remember**: Test locally, deploy confidently, save money! 💰
