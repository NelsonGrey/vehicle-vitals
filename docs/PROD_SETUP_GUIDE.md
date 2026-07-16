# Vehicle-Vitals - Complete Production Environment Setup Guide

## Overview

This guide will help you set up all required GitHub secrets for production deployment of Vehicle-Vitals.

## Required GitHub Secrets

Run these commands in your terminal (make sure you're authenticated with `gh auth login`):

### Firebase Configuration

```bash
gh secret set VITE_FIREBASE_API_KEY_PRODUCTION --body 'AIzaSyDE99EAoGniEwCLfu4llmv_NsSjbwr-ZRE'
gh secret set VITE_FIREBASE_AUTH_DOMAIN_PRODUCTION --body 'vehicle-vitals-prod.firebaseapp.com'
gh secret set VITE_FIREBASE_PROJECT_ID_PRODUCTION --body 'vehicle-vitals-prod'
gh secret set VITE_FIREBASE_STORAGE_BUCKET_PRODUCTION --body 'vehicle-vitals-prod.appspot.com'
gh secret set VITE_FIREBASE_MESSAGING_SENDER_ID_PRODUCTION --body '489413148337'
gh secret set VITE_FIREBASE_APP_ID_PRODUCTION --body '1:489413148337:web:9b4e97350073a22968ac90'
gh secret set VITE_FIREBASE_MEASUREMENT_ID_PRODUCTION --body 'G-32PCGDSNT9'
```

### Environment & Feature Flags

```bash
gh secret set VITE_DEBUG_PRODUCTION --body 'false'
gh secret set VITE_SHOW_COMING_SOON_PRODUCTION --body 'true'
```

### Analytics & Monitoring

```bash
gh secret set VITE_ANALYTICS_ID_PRODUCTION --body 'G-32PCGDSNT9'
gh secret set VITE_GTM_ID_PRODUCTION --body 'G-32PCGDSNT9'  # Supports GTM-XXXXXXX or G-XXXXXXXXXX
gh secret set VITE_SENTRY_DSN_PRODUCTION --body ''  # Set to actual Sentry DSN if using
```

### Ad Configuration

```bash
gh secret set VITE_ADSENSE_CLIENT --body 'ca-pub-5198775482699756'
gh secret set VITE_ADSENSE_SLOT --body '1234567890'  # Replace with actual AdSense slot ID
```

### Feature Flags

```bash
gh secret set VITE_ENABLE_DEBUG_TOOLS_PRODUCTION --body 'false'
gh secret set VITE_ENABLE_ANALYTICS_PRODUCTION --body 'true'
gh secret set VITE_ENABLE_ERROR_REPORTING_PRODUCTION --body 'true'
```

## Firebase Service Account Setup

### 1. Create Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your `vehicle-vitals-prod` project
3. Go to Project Settings → Service Accounts
4. Click "Generate new private key"
5. Download the JSON file

### 2. Set the Service Account Secret

```bash
# Copy the entire JSON content and set it as a secret
gh secret set FIREBASE_SERVICE_ACCOUNT_PRODUCTION --body '{
  "type": "service_account",
  "project_id": "vehicle-vitals-prod",
  ...
}'
```

## Firebase Token Setup (for manual deployments)

### 1. Get Firebase Token

```bash
firebase login:ci
# This will output a token like: 1/ABC123...
```

### 2. Set the Token Secret

```bash
gh secret set FIREBASE_TOKEN --body '1/ABC123...'  # Replace with actual token
```

## Verification

After setting all secrets, verify they were set correctly:

```bash
gh secret list | grep PRODUCTION
```

## Deploy Production

Once all secrets are set, trigger a production deployment:

```bash
gh workflow run master-pipeline.yml \
  -f action=build_and_deploy \
  -f environment=production
```

## Expected Result

After deployment, `https://vehicle-vitals-prod.web.app` should show the Coming Soon page instead of the full application.

## Troubleshooting

- If deployment fails, check the GitHub Actions logs
- Verify all secrets are set with correct values
- Ensure Firebase service account has proper permissions
- Check that the Firebase project exists and is accessible
