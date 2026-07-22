# App Store Connect API Key Setup

> **Status (July 20, 2026):** Active secret-handling reference. The iOS target
> is currently disabled in the project manifest, so setting these values alone
> does not trigger an upload.

To fix the 'invalid curve name' error, you need to set up the APP_STORE_CONNECT_KEY secret in GitHub.

## Steps to Create App Store Connect API Key:

1. Go to https://appstoreconnect.apple.com/
2. Navigate to Users and Access and the Integrations/API keys area shown by the
   current App Store Connect interface.
3. Click the '+' button to create a new API Key
4. Select 'App Store Connect API' as the key type
5. Choose the least-privileged role that supports the intended build/upload
   operation.
6. Download the .p8 file when created
7. Copy the entire contents of the .p8 file

## GitHub Secret Setup:

1. Go to the `NelsonGrey/vehicle-vitals` repository.
2. Settings → Secrets and variables → Actions
3. Create a new repository secret named: APP_STORE_CONNECT_KEY
4. Paste the entire .p8 file content as the secret value

## Required Secrets Summary:

- APP_STORE_CONNECT_KEY_ID: From the API key details page
- APP_STORE_CONNECT_ISSUER_ID: From the API key details page
- APP_STORE_CONNECT_KEY: The .p8 file content (full text)

The CI workflow will then be able to authenticate with App Store Connect for code signing and iOS release operations.
