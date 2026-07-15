# Vehicle-Vitals - User Acceptance Testing (UAT)

## Overview

This document describes the automated UAT suite for the Vehicle-Vitals web application. The suite uses **Playwright** to perform end-to-end testing of all major features and user workflows.

## Quick Start

### Installation

1. **Install dependencies** (if not already done):
   ```bash
   cd packages/web
   npm install
   ```

2. **Install Playwright browsers**:
   ```bash
   npx playwright install
   ```

### Running Tests

#### All Tests (Headless Mode)
```bash
npm run test:uat
```

#### Headed Mode (See Browser)
```bash
npm run test:uat:headed
```

#### Debug Mode (Interactive)
```bash
npm run test:uat:debug
```

#### View HTML Report
```bash
npm run test:uat:report
```

#### Run Single Test
```bash
npx playwright test --grep "TC-AUTH-001"
```

#### Run Specific Test File
```bash
npx playwright test uat.spec.ts
```

## Test Coverage

### 1. **Authentication (5 tests)**
- `TC-AUTH-001`: Sign up with email
- `TC-AUTH-002`: Log in with email
- `TC-AUTH-003`: Login fails with incorrect password
- `TC-AUTH-004`: User can sign out
- Session persistence

### 2. **Vehicle Management (4 tests)**
- `TC-VEHICLE-001`: Add new vehicle
- `TC-VEHICLE-002`: Edit vehicle details
- `TC-VEHICLE-003`: View vehicle details
- `TC-VEHICLE-004`: Vehicle list displays all vehicles

### 3. **Maintenance Records (3 tests)**
- `TC-RECORDS-001`: Add maintenance record
- `TC-RECORDS-002`: Records display in chronological order
- `TC-RECORDS-003`: Upload file attachments

### 4. **Timeline & Dashboard (2 tests)**
- `TC-TIMELINE-001`: Timeline displays vehicle history
- `TC-TIMELINE-002`: Home dashboard displays vehicle summary

### 5. **Upcoming Tasks (2 tests)**
- `TC-UPCOMING-001`: Upcoming tasks page displays maintenance reminders
- `TC-UPCOMING-002`: User can mark tasks as complete

### 6. **Service Providers (2 tests)**
- `TC-PROVIDERS-001`: Service providers page loads
- `TC-PROVIDERS-002`: User can add a service provider

### 7. **User Profile (2 tests)**
- `TC-PROFILE-001`: User can view profile page
- `TC-PROFILE-002`: User can update profile information

### 8. **UI/UX (3 tests)**
- `TC-UI-001`: Landing page is responsive
- `TC-UI-002`: Navigation menu is accessible
- `TC-UI-003`: Pages load without console errors

### 9. **Data Persistence (1 test)**
- `TC-DATA-001`: User data persists after logout and login

## Configuration

### Environment Variables

```bash
# Test against specific environment
BASE_URL=https://vehicle-vitals-dev.web.app npm run test:uat

# For CI/CD
CI=true npm run test:uat
```

### Browser Support

Tests run against:
- ✅ Chromium (Recommended)
- ✅ Firefox
- ✅ WebKit (Safari)

### Test Settings

- **Timeout**: 60 seconds per test
- **Retries**: 0 (local), 2 (CI)
- **Workers**: 1 (sequential execution for reliability)
- **Screenshots**: Captured on failure
- **Video**: Recorded on failure
- **Trace**: Recording on first retry (CI only)

## Output & Reports

### Report Formats

1. **HTML Report** (Interactive)
   - Location: `test-results/html/index.html`
   - View: `npm run test:uat:report`

2. **JSON Report**
   - Location: `test-results/results.json`
   - Use: For CI/CD integration

3. **JUnit XML**
   - Location: `test-results/junit.xml`
   - Use: For test management systems

4. **Console Output**
   - Lists: Pass/Fail status for each test

### Example Output

```
✓ TC-AUTH-001: User can sign up with email
✓ TC-AUTH-002: User can log in with email
✗ TC-VEHICLE-001: User can add a new vehicle (screenshot saved)
...
23 passed, 1 failed in 5 minutes
```

## CI/CD Integration

### GitHub Actions

Add to `.github/workflows/test.yml`:

```yaml
- name: Run UAT Tests
  run: |
    cd packages/web
    npm install
    npx playwright install
    npm run test:uat

- name: Upload Test Reports
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: packages/web/test-results/
```

## Troubleshooting

### Tests Timeout

**Problem**: Tests time out waiting for elements
**Solution**:
```bash
# Increase timeout
npx playwright test --timeout 120000
```

### Browser Won't Start

**Problem**: "Browser not found"
**Solution**:
```bash
npx playwright install
npx playwright install-deps  # For Linux
```

### Network Errors

**Problem**: Tests can't reach dev server
**Solution**:
1. Verify `BASE_URL` environment variable
2. Check dev server is running: `npm run dev`
3. Verify VPN/firewall isn't blocking access

### Login Fails

**Problem**: Test account not created
**Solution**:
```bash
# Run first test with --headed to see what happens
npm run test:uat:headed --grep "TC-AUTH-001"
```

### Element Not Found

**Problem**: Selectors changed in UI
**Solution**:
```bash
# Debug mode shows page content
npm run test:uat:debug
```
- Step through test
- Inspect page elements
- Update selectors in test file

## Best Practices

### Running Tests Locally

1. **Before committing code:**
   ```bash
   npm run test:uat
   ```

2. **Debug specific feature:**
   ```bash
   npm run test:uat:headed --grep "VEHICLE"
   ```

3. **View failed test video:**
   ```bash
   npm run test:uat:report
   # Click on failed test in HTML report
   ```

### Maintaining Tests

1. **Update selectors when UI changes**
   - Prefer `getByRole()` (accessible)
   - Fallback to `getByLabel()`, `getByPlaceholder()`
   - Avoid `getByXPath()`, `getBySelector()`

2. **Add new test for new features**
   - Follow naming convention: `TC-FEATURE-###`
   - Group in describe block
   - Use `test.beforeEach()` for common setup

3. **Keep tests independent**
   - Each test can run alone
   - Don't rely on test execution order
   - Use unique data (timestamps, random IDs)

## Test Data

### Test User

- **Email**: `test-{timestamp}@example.com`
- **Password**: `TestPassword123!@#`
- **Auto-created** on first sign-up test

### Test Vehicle

- **Make**: Toyota
- **Model**: Camry
- **Year**: 2020
- **VIN**: 12345ABCDE67890FGH00

## Performance

### Typical Test Execution Times

- **Single test**: 10-30 seconds
- **Full suite (25 tests)**: 5-10 minutes
- **Parallel execution**: 2-3 minutes (CI/CD)

### Performance Tips

1. **Run only specific tests**:
   ```bash
   npx playwright test --grep "TC-AUTH"
   ```

2. **Use headed mode sparingly** (slower than headless)

3. **Enable parallel execution** in `playwright.config.ts`:
   ```ts
   workers: 4  // Adjust based on machine
   ```

## Contributing

### Adding New Tests

1. Open `packages/web/tests/uat.spec.ts`

2. Add test to appropriate `describe()` block:
   ```typescript
   test('TC-FEATURE-###: Test description', async ({ page }) => {
     await page.goto(`${BASE_URL}/path`);
     // Test steps
     await expect(element).toBeVisible();
   });
   ```

3. Run test:
   ```bash
   npm run test:uat:headed --grep "TC-FEATURE-###"
   ```

4. Commit with tests passing

### Reporting Issues

If a test fails:
1. Check HTML report: `npm run test:uat:report`
2. Review screenshot/video in report
3. Look for selectors that changed
4. Update test or file bug if app issue

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors Guide](https://playwright.dev/docs/selectors)
- [Debugging Guide](https://playwright.dev/docs/debug)

## Support

For questions or issues with UAT tests:
1. Check this README
2. Review test output and HTML report
3. Run `npm run test:uat:debug` to inspect
4. Consult Playwright docs
