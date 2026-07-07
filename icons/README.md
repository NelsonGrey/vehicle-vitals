# Icons Directory

This directory contains the canonical icon assets for the Vehicle Vitals project.

## Master Icons

- **`icon-vehicle-vitals.png`**: High-resolution master icon (1024x1024 or larger recommended)
- **`icon-vehicle-vitals.svg`**: Vector format master icon (optional, preferred for scaling)

## Automated Icon Generation

To regenerate all app icons from the master PNG, run:

```bash
./scripts/apply-new-icon.sh icons/icon-vehicle-vitals.png
```

This script will automatically generate:

- **iOS App Icons**: All required sizes for AppIcon.appiconset (@1x, @2x, @3x variants)
- **Android Icons**: All mipmap densities (mdpi through xxxhdpi) + adaptive icons
- **Flutter Web/PWA**: Icon-192, Icon-512, maskable variants for progressive web app
- **React Web App**: favicon sizes, apple-touch-icon, android-chrome icons

## Manual Regeneration

If you need to regenerate specific icon sets:

### iOS Icons

Navigate to `packages/mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/` and replace PNG files.

### Android Icons

Navigate to `packages/mobile/android/app/src/main/res/mipmap-*/` directories.

### Web Icons

- **Flutter Web**: `packages/mobile/web/icons/`
- **React Web**: `packages/web/public/`

## Icon Design Guidelines

- **Size**: Source icon should be at least 1024x1024 pixels
- **Format**: PNG with transparency (for overlays), or solid background
- **Padding**: Include ~10% padding around main icon content for better visibility
- **Colors**: Match the Vehicle Vitals dark slate and cyan/teal brand system (`#020617`, `#06b6d4`, `#14b8a6`, `#fffaf3`)
- **Style**: Modern, professional, automotive-health themed, and recognizable at small sizes

## Current Icon Design

The current icon uses a dark slate app tile with a garage-roof/road `V`, vehicle-health gauge, and verified-record document badge. It represents maintenance planning, vehicle health confidence, and ownership proof.

## Updating the Icon

1. Place new high-resolution PNG in this directory as `icon-vehicle-vitals.png`
2. Run `./scripts/apply-new-icon.sh icons/icon-vehicle-vitals.png`
3. Review generated icons in all platforms
4. Commit the changes
5. Deploy to App Store and Google Play

## Resources

- iOS Icon Guidelines: https://developer.apple.com/design/human-interface-guidelines/app-icons
- Android Icon Guidelines: https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive
- PWA Icon Guidelines: https://web.dev/add-manifest/
