# Firebase Configuration Files by Environment

This directory contains environment-specific Firebase configuration files for iOS and Android.

## 📁 Directory Structure

```
config/
├── development/
│   ├── android/
│   │   └── google-services.json          # Development Firebase project
│   └── ios/
│       └── GoogleService-Info.plist      # Development Firebase project
├── staging/
│   ├── android/
│   │   └── google-services.json          # Staging Firebase project
│   └── ios/
│       └── GoogleService-Info.plist      # Staging Firebase project
└── production/
    ├── android/
    │   └── google-services.json          # Production Firebase project
    └── ios/
        └── GoogleService-Info.plist      # Production Firebase project
```

## 🔧 How to Get Configuration Files

### Android (google-services.json)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select the appropriate project:
   - **Development**: `vehicle-vitals-dev`
   - **Staging**: `vehicle-vitals-staging`
   - **Production**: `vehicle-vitals-prod`
3. Go to Project Settings → General → Your apps
4. Select your Android app or add it if it doesn't exist
5. Download the `google-services.json` file
6. Place it in the appropriate `config/{environment}/android/` directory

### iOS (GoogleService-Info.plist)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select the appropriate project (same as above)
3. Go to Project Settings → General → Your apps
4. Select your iOS app or add it if it doesn't exist
5. Download the `GoogleService-Info.plist` file
6. Place it in the appropriate `config/{environment}/ios/` directory

## 🚀 Build Process

The build scripts automatically copy the correct configuration files based on the environment:

- **Development builds**: Use `config/development/` files
- **Staging builds**: Use `config/staging/` files
- **Production builds**: Use `config/production/` files

## ⚠️ Important Notes

- **Never commit actual config files** - They contain sensitive API keys
- **Add to .gitignore**: Ensure `config/*/android/google-services.json` and `config/*/ios/GoogleService-Info.plist` are ignored
- **Environment mapping**:
  - Development → `vehicle-vitals-dev`
  - Staging → `vehicle-vitals-staging`
  - Production → `vehicle-vitals-prod`