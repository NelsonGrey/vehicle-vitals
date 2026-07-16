# Fix APP_STORE_CONNECT_KEY Setup

## Issue: The APP_STORE_CONNECT_KEY in your .env.development file appears to be truncated or incomplete.

## Steps to Fix:

1. **Download the complete .p8 file from App Store Connect:**
   - Go to https://appstoreconnect.apple.com/
   - Navigate to Users and Access → Keys
   - Find your API key (Key ID: 5BHHAP959B)
   - Click 'Download API Key' to get the .p8 file

2. **Copy the complete file content:**
   - Open the downloaded .p8 file in a text editor
   - Copy the ENTIRE content (should be much longer than what's currently in .env.development)
   - It should look like:
     ```
     -----BEGIN PRIVATE KEY-----
     [Long base64-encoded key data - many lines]
     -----END PRIVATE KEY-----
     ```

3. **Update .env.development:**
   - Replace the current APP_STORE_CONNECT_KEY value with the complete .p8 content
   - Make sure there are no line breaks or formatting issues

4. **Set GitHub Secret:**
   - Go to your repository: https://github.com/mnelson3/vehicle-vitals
   - Settings → Secrets and variables → Actions
   - Create/update the APP_STORE_CONNECT_KEY secret with the complete .p8 content

## Current Issue:

The current APP_STORE_CONNECT_KEY only has headers and a small amount of data, but EC private keys need the complete key material to be parsed correctly.

The error 'string contains null byte' occurs because OpenSSL is trying to parse incomplete key data.
