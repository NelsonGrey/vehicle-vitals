# 🧪 Vehicle-Vitals UAT - Quick Reference

Last verified: July 20, 2026

## Install & Run (30 seconds)

```bash
npm ci
cd packages/web
npx playwright install
npm run test:uat:chromium
```

## Common Commands

| Command | Purpose |
|---------|---------|
| `npm run test:uat` | Run all tests (headless) |
| `npm run test:uat:headed` | See browser during tests |
| `npm run test:uat:debug` | Interactive debug mode |
| `npm run test:uat:report` | View HTML test report |
| `npx playwright test --grep "AUTH"` | Run only auth tests |

## Test Coverage

```
✅ Authentication (Sign Up, Login, Logout, Session)
✅ Vehicle Management (Add, Edit, View, List)
✅ Maintenance Records (Create, View, Attachments)
✅ Timeline & Dashboard
✅ Upcoming Tasks & Reminders
✅ Service Providers
✅ User Profile & Settings
✅ UI/UX & Navigation
✅ Data Persistence
```

## Test Results

After running tests, view detailed results:

```bash
npm run test:uat:report
```

**Output includes:**
- ✓ Pass/Fail status for each test
- 📸 Screenshots of failures
- 🎥 Video recordings of failures
- ⏱️ Execution time per test
- 📊 Overall pass rate

## CI/CD Integration

Tests are automatically run on:
- ✅ Pull requests
- ✅ Pushes to develop
- ✅ Pre-deployment

**Reports saved to:** `packages/web/test-results/`

## File Locations

| File | Purpose |
|------|---------|
| `tests/uat.spec.ts` | All test cases |
| `playwright.config.ts` | Test configuration |
| `UAT_TESTING.md` | Full documentation |
| `test-results/` | Test reports & artifacts |

## Next Steps

1. **First time setup:**
   ```bash
   npm install && npx playwright install
   ```

2. **Run full suite:**
   ```bash
   npm run test:uat
   ```

3. **View report:**
   ```bash
   npm run test:uat:report
   ```

4. **Debug failures:**
   ```bash
   npm run test:uat:debug --grep "TC-NAME"
   ```

## Support

See `UAT_TESTING.md` for:
- Detailed test descriptions
- Troubleshooting guide
- Best practices
- Contributing new tests

---

**Current spec:** `tests/uat.spec.ts` (36 declared cases at the July 20 review;
environment prerequisites can cause intentional skips).
**CI:** Chromium, Firefox, and WebKit against the hosted target selected by the
master pipeline.
