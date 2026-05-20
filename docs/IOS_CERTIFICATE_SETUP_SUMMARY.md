# iOS Certificate Setup Summary - Vehicle Vitals

> **Status**: Archived summary. Legacy beta-distribution references are not part of the current active pipeline.

## ✅ Completed Setup

### 1. Certificate Repository Created

- **Repository**: `https://github.com/mnelson3/vehicle-vitals-certificates`
- **Status**: Private repository created and initialized
- **Contents**: README.md, .gitignore, setup script

### 2. Fastlane Configuration Updated

- **Matchfile**: Configured for Vehicle Vitals certificates repository
- **Appfile**: Updated with correct app identifier (`com.nelsongrey.vehiclevitals.app.ios`)
- **Fastfile**: Added certificate management lanes:
  - `sync_signing` - Sync certificates from repo
  - `certificates_development` - Generate dev certificates
  - `certificates_appstore` - Generate App Store certificates
  - `certificates_all` - Generate all certificates
  - `build_beta_channel` - Build and sign for Legacy Beta Channel
  - `beta` - Upload to Legacy Beta Channel

### 3. Setup Scripts Created

- **Repository Setup**: `scripts/setup-certificates-repo.sh` (completed)
- **Certificate Generation**: `scripts/setup-ios-certificates.sh` (ready to run)

### 4. Documentation Updated

- **Guide**: `docs/IOS_CERTIFICATE_SETUP_GUIDE.md` updated for Vehicle Vitals
- **Workflow**: `.github/workflows/ios-distribution.yml` updated for Fastlane Match

## 🔑 Next Steps (Manual Actions Required)

### Step 1: Generate GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Create new token with `repo` scope
3. Save the token securely (you'll need it for CI/CD)

### Step 2: Create App Store Connect API Key

1. Go to: https://appstoreconnect.apple.com → Users and Access → Keys
2. Create new API key with "Admin" role
3. Name: "Vehicle Vitals CI"
4. Download the `.p8` file
5. Note the Key ID and Issuer ID

### Step 3: Run Certificate Setup

```bash
# Run the automated setup script
./scripts/setup-ios-certificates.sh
```

This script will:

- Prompt for your GitHub Personal Access Token
- Initialize Fastlane Match
- Generate development and App Store certificates
- Store certificates in the private repository

### Step 4: Configure CI/CD Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

```
FASTLANE_APPLE_ID=your-apple-id@example.com
FASTLANE_TEAM_ID=YOUR_TEAM_ID
FASTLANE_ITC_TEAM_ID=YOUR_ITC_TEAM_ID
APP_STORE_CONNECT_KEY_ID=YOUR_API_KEY_ID
APP_STORE_CONNECT_ISSUER_ID=YOUR_ISSUER_ID
APP_STORE_CONNECT_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----
MATCH_GIT_URL=https://oauth2:gho_YOUR_TOKEN@github.com/mnelson3/vehicle-vitals-certificates.git
MATCH_PASSWORD=your_match_password
BETA_FEEDBACK_EMAIL=support@vehicle-vitals.com
```

### Step 5: Test the Setup

```bash
# Test certificate sync
cd packages/mobile/ios
fastlane sync_signing

# Test full build and upload (optional)
fastlane beta
```

## 🔧 Technical Details

### Repository Structure

```
vehicle-vitals-certificates/
├── README.md
├── .gitignore
└── certs/ (created by Fastlane Match)
    ├── development/
    └── appstore/
```

### Fastlane Configuration

- **Storage**: Git-based certificate storage
- **Encryption**: Password-protected certificates
- **Branch**: `main` (matches main repo)
- **App ID**: `com.nelsongrey.vehiclevitals.app.ios`

### CI/CD Integration

- **Runner**: Self-hosted macOS runner (`vehicle-vitals` label)
- **Trigger**: Push/PR to `main`/`develop` branches affecting mobile code
- **Environment**: Automatic environment selection based on branch

## 🚨 Important Notes

1. **Security**: Never commit certificates or private keys to the main repository
2. **Access**: Only authorized team members should have access to the certificates repository
3. **Rotation**: Rotate certificates annually or when compromised
4. **Backup**: The certificates repository serves as your backup

## 📞 Support

If you encounter issues:

1. Check the logs from the setup script
2. Verify your Apple Developer Program membership
3. Ensure App Store Connect API key has correct permissions
4. Confirm GitHub token has `repo` scope

## ✅ Verification Checklist

- [ ] GitHub Personal Access Token created
- [ ] App Store Connect API key generated
- [ ] Certificate setup script run successfully
- [ ] CI/CD secrets configured
- [ ] Test build completed
- [ ] iOS workflow runs successfully

---

**Generated**: $(date)
**Project**: Vehicle Vitals
**Certificate Repository**: https://github.com/mnelson3/vehicle-vitals-certificates
