#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/../.." && pwd)"
library_root="$repo_root/media-library"

copy_file() {
  local source_rel="$1"
  local destination_rel="$2"
  local source="$repo_root/$source_rel"
  local destination="$library_root/$destination_rel"

  if [[ ! -f "$source" ]]; then
    echo "Missing source: $source_rel" >&2
    return 1
  fi

  mkdir -p "$(dirname "$destination")"
  cp -p "$source" "$destination"
}

copy_media_tree() {
  local source_rel="$1"
  local destination_rel="$2"
  local source="$repo_root/$source_rel"
  local destination="$library_root/$destination_rel"

  if [[ ! -d "$source" ]]; then
    echo "Missing source directory: $source_rel" >&2
    return 1
  fi

  while IFS= read -r -d '' file; do
    local relative="${file#"$source/"}"
    mkdir -p "$destination/$(dirname "$relative")"
    cp -p "$file" "$destination/$relative"
  done < <(
    find "$source" -type f \( \
      -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' -o \
      -iname '*.webp' -o -iname '*.avif' -o -iname '*.gif' -o \
      -iname '*.svg' -o -iname '*.ico' -o -iname '*.mp4' -o \
      -iname '*.mov' -o -iname '*.m4v' -o -iname '*.webm' -o \
      -iname '*.mp3' -o -iname '*.wav' -o -iname '*.m4a' \
    \) -print0
  )
}

mkdir -p \
  "$library_root/_inventory" \
  "$library_root/_quarantine" \
  "$library_root/shared-brand/masters" \
  "$library_root/shared-brand/current-social-profile" \
  "$library_root/shared-content"

# Shared brand sources. Both mark families are preserved because the current
# product surfaces do not yet use one consistent logo family.
copy_file "artifacts/logo-preview/vehicle-vitals-master-4096.png" \
  "shared-brand/masters/complex-mark-transparent-4096.png"
copy_file "artifacts/logo-preview/vehicle-vitals-master-1024.png" \
  "shared-brand/masters/complex-mark-transparent-1024.png"
copy_file "artifacts/logo-preview/vehicle-vitals-mark-transparent-1024.png" \
  "shared-brand/masters/complex-mark-transparent-1024-alternate.png"
copy_file "artifacts/logo-preview/vehicle-vitals-favicon-refined-512.png" \
  "shared-brand/masters/simplified-mark-opaque-512.png"
copy_file "artifacts/logo-preview/vehicle-vitals-favicon-simplified-source.png" \
  "shared-brand/masters/simplified-mark-source.png"
if [[ -f "$repo_root/icons/icon-vehicle-vitals.svg" ]]; then
  copy_file "icons/icon-vehicle-vitals.svg" \
    "shared-brand/masters/legacy-vector-reference.svg"
fi
copy_file "packages/web/public/android-chrome-512x512.png" \
  "shared-brand/current-social-profile/profile-current-complex-alpha-512.png"
copy_file "packages/mobile/assets/branding/vehicle-vitals-icon-full.png" \
  "shared-brand/current-social-profile/profile-alternate-simplified-opaque-512.png"
copy_file "packages/web/public/apple-touch-icon.png" \
  "shared-brand/current-social-profile/profile-current-complex-alpha-180.png"

# Website: current runtime media plus the complete July 14 capture set.
copy_media_tree "packages/web/public/assets" "website/runtime/brand"
copy_media_tree "packages/web/public/images" "website/runtime/images"
copy_media_tree "packages/web/public/videos" "website/runtime/videos"
copy_file "packages/web/public/favicon.ico" "website/runtime/icons/favicon.ico"
copy_file "packages/web/public/favicon-16x16.png" "website/runtime/icons/favicon-16x16.png"
copy_file "packages/web/public/favicon-32x32.png" "website/runtime/icons/favicon-32x32.png"
copy_file "packages/web/public/apple-touch-icon.png" "website/runtime/icons/apple-touch-icon.png"
copy_file "packages/web/public/android-chrome-192x192.png" "website/runtime/icons/android-chrome-192x192.png"
copy_file "packages/web/public/android-chrome-512x512.png" "website/runtime/icons/android-chrome-512x512.png"
if [[ -f "$repo_root/packages/web/public/vehicle-vitals-icon.svg" ]]; then
  copy_file "packages/web/public/vehicle-vitals-icon.svg" "website/runtime/icons/vehicle-vitals-icon.svg"
fi
copy_media_tree "output/playwright/vehicle-vitals-2026-07-14/web" \
  "website/captures/2026-07-14"

# iOS: runtime branding, app icon catalog, full capture masters, and the
# separate opaque 1242x2688 App Store-ready screenshot set.
copy_media_tree "packages/mobile/assets/branding" "ios-app/runtime/brand"
copy_media_tree "packages/mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset" \
  "ios-app/runtime/app-icons"
copy_media_tree "output/playwright/vehicle-vitals-2026-07-14/ios" \
  "ios-app/captures/2026-07-14"
copy_media_tree "artifacts/asc-screenshots/2026-07-16" \
  "ios-app/app-store/iphone-6.5-inch-1242x2688"

# Android: launcher assets and the current Play listing icon. Android-specific
# store screenshots and a feature graphic do not currently exist.
for density in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
  copy_media_tree "packages/mobile/android/app/src/main/res/mipmap-$density" \
    "android-app/runtime/launcher-icons/mipmap-$density"
done
copy_file "packages/mobile/android/fastlane/metadata/android/en-US/images/icon.png" \
  "android-app/google-play/icon-512.png"

# Social targets. Profile copies intentionally use the same current app/social
# mark. Existing content that is not in the correct aspect ratio remains in
# shared-content rather than being mislabeled upload-ready.
for target in facebook instagram tiktok threads x reddit youtube; do
  copy_file "packages/web/public/android-chrome-512x512.png" \
    "$target/profile/profile-current-complex-alpha-512.png"
  copy_file "packages/mobile/assets/branding/vehicle-vitals-icon-full.png" \
    "$target/profile/profile-alternate-simplified-opaque-512.png"
done
copy_file "output/imagegen/youtube/vehicle-vitals-youtube-banner-2560x1440.png" \
  "youtube/banner/candidate-2560x1440-safe-area-unverified.png"

# Reusable source content for future platform-specific crops and layouts.
copy_file "packages/web/public/images/hero-garage.jpg" \
  "shared-content/hero-garage-square-512.jpg"
copy_file "output/playwright/vehicle-vitals-2026-07-14/web/desktop/app-garage.png" \
  "shared-content/web-garage-desktop.png"
copy_file "output/playwright/vehicle-vitals-2026-07-14/web/desktop/app-garage-detail.png" \
  "shared-content/web-vehicle-detail-desktop.png"
copy_file "output/playwright/vehicle-vitals-2026-07-14/web/desktop/app-records.png" \
  "shared-content/web-records-desktop.png"
copy_file "output/playwright/vehicle-vitals-2026-07-14/web/desktop/app-maintenance-plan.png" \
  "shared-content/web-maintenance-plan-desktop.png"
copy_file "output/playwright/vehicle-vitals-2026-07-14/web/desktop/app-service-history.png" \
  "shared-content/web-service-history-desktop.png"
copy_file "output/playwright/vehicle-vitals-2026-07-14/web/desktop/app-shops-services.png" \
  "shared-content/web-shops-services-desktop.png"
for name in garage vehicle-detail records maintenance-plan service-history shops-services; do
  copy_file "output/playwright/vehicle-vitals-2026-07-14/ios/iphone-17-pro-max/signed-in/$name.png" \
    "shared-content/ios-$name-1320x2868.png"
done

# Complete source inventory. Quarantined review recordings are indexed here
# but not copied; duplicating that 2.8 GB tree would waste space and increase
# the chance that unsafe evidence is uploaded publicly.
inventory="$library_root/_inventory/source-media.csv"
printf 'source_path,bytes,kind,width,height,duration_seconds,alpha,sha256,classification\n' > "$inventory"

while IFS= read -r -d '' file; do
  relative="${file#"$repo_root/"}"
  bytes="$(stat -f '%z' "$file")"
  extension="${file##*.}"
  extension="$(printf '%s' "$extension" | tr '[:upper:]' '[:lower:]')"
  kind="image"
  width=""
  height=""
  duration=""
  alpha=""

  case "$extension" in
    mp4|mov|m4v|webm|avi)
      kind="video"
      width="$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$file" 2>/dev/null | head -1 || true)"
      height="$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$file" 2>/dev/null | head -1 || true)"
      duration="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$file" 2>/dev/null | head -1 || true)"
      ;;
    mp3|wav|m4a)
      kind="audio"
      duration="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$file" 2>/dev/null | head -1 || true)"
      ;;
    pdf)
      kind="document"
      ;;
    svg)
      kind="vector"
      ;;
    ico)
      kind="icon"
      ;;
    *)
      width="$(sips -g pixelWidth "$file" 2>/dev/null | awk -F': ' '/pixelWidth/{print $2}' || true)"
      height="$(sips -g pixelHeight "$file" 2>/dev/null | awk -F': ' '/pixelHeight/{print $2}' || true)"
      alpha="$(sips -g hasAlpha "$file" 2>/dev/null | awk -F': ' '/hasAlpha/{print $2}' || true)"
      ;;
  esac

  classification="reference"
  case "$relative" in
    *DO-NOT-UPLOAD*|output/app-review/invalid/*)
      classification="quarantine-do-not-upload"
      ;;
    artifacts/logo-preview-color-bleed-archive/*)
      classification="archive-do-not-use"
      ;;
    media-library/*)
      continue
      ;;
    packages/web/public/*|packages/mobile/assets/branding/*|packages/mobile/*/Runner/Assets.xcassets/*)
      classification="runtime"
      ;;
    artifacts/asc-screenshots/2026-07-16/*)
      classification="app-store-ready"
      ;;
    output/playwright/vehicle-vitals-2026-07-14/*)
      classification="capture-master"
      ;;
    output/imagegen/youtube/*)
      classification="candidate-needs-safe-area-review"
      ;;
    output/app-review/*)
      classification="review-evidence-not-marketing"
      ;;
  esac

  sha256="$(shasum -a 256 "$file" | awk '{print $1}')"
  escaped_relative="${relative//\"/\"\"}"
  printf '"%s",%s,%s,%s,%s,%s,%s,%s,%s\n' \
    "$escaped_relative" "$bytes" "$kind" "$width" "$height" "$duration" \
    "$alpha" "$sha256" "$classification" >> "$inventory"
done < <(
  find "$repo_root" -type f \( \
    -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' -o \
    -iname '*.webp' -o -iname '*.avif' -o -iname '*.gif' -o \
    -iname '*.svg' -o -iname '*.ico' -o -iname '*.mp4' -o \
    -iname '*.mov' -o -iname '*.m4v' -o -iname '*.webm' -o \
    -iname '*.avi' -o -iname '*.mp3' -o -iname '*.wav' -o \
    -iname '*.m4a' -o -iname '*.pdf' \
  \) \
    -not -path "$repo_root/.git/*" \
    -not -path "$repo_root/node_modules/*" \
    -not -path '*/node_modules/*' \
    -not -path '*/Pods/*' \
    -not -path '*/build/*' \
    -not -path '*/dist/*' \
    -not -path "$library_root/*" \
    -print0
)

python3 "$repo_root/scripts/media-library/generate-gap-assets.py"

find "$library_root" -type f -not -path "$library_root/_inventory/*" -print0 \
  | sort -z \
  | xargs -0 shasum -a 256 \
  > "$library_root/_inventory/library-sha256.txt"

python3 "$repo_root/scripts/media-library/sync-unified-media-library.py"

echo "Media library built at $library_root"
