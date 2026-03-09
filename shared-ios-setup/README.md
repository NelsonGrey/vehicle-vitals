# Shared iOS Setup - Reference Configuration

This folder contains a reference iOS Fastlane configuration for this repository.
It is not a credential-sharing template for other solutions.

## Files Included

- `fastlane/Fastfile` - Comprehensive lane definitions with robust error handling
- `fastlane/Appfile` - App-specific configuration
- `fastlane/Matchfile` - Certificate and profile management
- `fastlane/exportOptions.plist` - Xcode export options for App Store distribution

## Design Notes

1. **Robust API Key Handling** - Multiple fallback methods for App Store Connect authentication
2. **Smart Build Process** - Automatic IPA detection with fallback export mechanisms
3. **Controlled Distribution Lanes** - Build and release lanes for iOS delivery
4. **Phone Number Sanitization** - Proper E.164 formatting for App Store Connect
5. **Error Recovery** - Multiple retry strategies for upload failures

## Implementation Steps

1. Copy these files to your project's `packages/mobile/ios/fastlane/` directory
2. Update `Appfile` with your app's bundle identifier
3. Ensure all required environment variables are set in your CI/CD workflows
4. Test the `beta` lane locally before deploying

## Required Environment Variables

- `APP_STORE_CONNECT_KEY` - App Store Connect private key
- `APP_STORE_CONNECT_KEY_ID` - App Store Connect key ID
- `APP_STORE_CONNECT_ISSUER_ID` - App Store Connect issuer ID
- `FASTLANE_APPLE_ID` - Apple ID email
- `FASTLANE_TEAM_ID` - Developer team ID
- `FASTLANE_ITC_TEAM_ID` - App Store Connect team ID
- `MATCH_GIT_URL` - Git URL for certificates repository
- `MATCH_PASSWORD` - Password for certificates repository
- `BETA_FEEDBACK_EMAIL` - Email for release feedback
- `BETA_CONTACT_PHONE` - Phone for release contact (optional)
- `RELEASE_NOTES` - Release notes

## Usage

```bash
# Run App Store submission
bundle exec fastlane submit_to_app_store release_notes:"Your release notes"
```

Use this configuration only within the Vehicle Vitals repository context.
