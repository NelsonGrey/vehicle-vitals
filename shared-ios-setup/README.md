# Shared iOS Setup - Zero-Touch Deployment

This folder contains the proven, successful iOS configuration from wishlist-wizard that has demonstrated reliable TestFlight uploads and App Store deployments.

## Files Included

- `fastlane/Fastfile` - Comprehensive lane definitions with robust error handling
- `fastlane/Appfile` - App-specific configuration
- `fastlane/Matchfile` - Certificate and profile management
- `fastlane/exportOptions.plist` - Xcode export options for App Store distribution

## Key Success Factors

1. **Robust API Key Handling** - Multiple fallback methods for App Store Connect authentication
2. **Smart Build Process** - Automatic IPA detection with fallback export mechanisms
3. **Comprehensive Beta Lane** - Detailed TestFlight upload with metadata management
4. **Phone Number Sanitization** - Proper E.164 formatting for App Store Connect
5. **Error Recovery** - Multiple retry strategies for upload failures

## Implementation Steps

1. Copy these files to your project's `packages/mobile/ios/fastlane/` directory
2. Update `Appfile` with your app's bundle identifier
3. Ensure all required environment variables are set in your CI/CD workflows
4. Test the `beta` lane locally before deploying

## Required Environment Variables

- `ASC_PRIVATE_KEY` - App Store Connect private key
- `ASC_KEY_ID` - App Store Connect key ID
- `ASC_ISSUER_ID` - App Store Connect issuer ID
- `FASTLANE_APPLE_ID` - Apple ID email
- `FASTLANE_TEAM_ID` - Developer team ID
- `FASTLANE_ITC_TEAM_ID` - App Store Connect team ID
- `MATCH_GIT_URL` - Git URL for certificates repository
- `MATCH_PASSWORD` - Password for certificates repository
- `BETA_FEEDBACK_EMAIL` - Email for beta feedback
- `BETA_CONTACT_PHONE` - Phone for beta contact (optional)
- `RELEASE_NOTES` - Release notes for TestFlight

## Usage

```bash
# Run TestFlight upload
bundle exec fastlane beta

# Run App Store submission
bundle exec fastlane submit_to_app_store release_notes:"Your release notes"
```

This configuration has been battle-tested and provides the most reliable iOS deployment process across the workspace.