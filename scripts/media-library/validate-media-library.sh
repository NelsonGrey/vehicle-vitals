#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/../.." && pwd)"
library_root="$repo_root/media-library"
failures=0

expect_file() {
  if [[ ! -f "$library_root/$1" ]]; then
    echo "FAIL missing: $1"
    failures=$((failures + 1))
  fi
}

expect_dimensions() {
  local relative="$1"
  local expected_width="$2"
  local expected_height="$3"
  local actual_width
  local actual_height

  actual_width="$(sips -g pixelWidth "$library_root/$relative" 2>/dev/null | awk -F': ' '/pixelWidth/{print $2}')"
  actual_height="$(sips -g pixelHeight "$library_root/$relative" 2>/dev/null | awk -F': ' '/pixelHeight/{print $2}')"

  if [[ "$actual_width" != "$expected_width" || "$actual_height" != "$expected_height" ]]; then
    echo "FAIL dimensions: $relative expected ${expected_width}x${expected_height}, got ${actual_width}x${actual_height}"
    failures=$((failures + 1))
  fi
}

expect_no_alpha() {
  local relative="$1"
  local alpha
  alpha="$(sips -g hasAlpha "$library_root/$relative" 2>/dev/null | awk -F': ' '/hasAlpha/{print $2}')"
  if [[ "$alpha" != "no" ]]; then
    echo "FAIL alpha: $relative must be opaque, got $alpha"
    failures=$((failures + 1))
  fi
}

expect_video_dimensions() {
  local relative="$1"
  local expected_width="$2"
  local expected_height="$3"
  local dimensions
  dimensions="$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$library_root/$relative" 2>/dev/null)"
  if [[ "$dimensions" != "${expected_width}x${expected_height}" ]]; then
    echo "FAIL video dimensions: $relative expected ${expected_width}x${expected_height}, got $dimensions"
    failures=$((failures + 1))
  fi
}

expect_file "README.md"
expect_file "TARGET_REQUIREMENTS.md"
expect_file "READINESS.md"
expect_file "_inventory/source-media.csv"
expect_file "_inventory/library-sha256.txt"
expect_file "shared-brand/current-social-profile/profile-current-complex-alpha-512.png"
expect_file "shared-brand/current-social-profile/profile-alternate-simplified-opaque-512.png"
expect_file "youtube/banner/candidate-2560x1440-safe-area-unverified.png"
expect_file "android-app/google-play/icon-512.png"
expect_file "android-app/google-play/feature-graphic-1024x500.png"
expect_file "shared-brand/fonts/Montserrat-Regular.ttf"
expect_file "shared-brand/fonts/Montserrat-ExtraBold.ttf"
expect_file "shared-brand/fonts/OFL-Montserrat.txt"
expect_file "shared-brand/guidelines/vehicle-vitals-brand-usage-guide.pdf"
expect_file "x/header/vehicle-vitals-header-1500x500.png"
expect_file "facebook/cover/vehicle-vitals-cover-master-1640x624.png"
expect_file "facebook/cover/vehicle-vitals-cover-820x312.png"
expect_file "reddit/banner/vehicle-vitals-community-banner-1080x128.png"
expect_file "shared-content/copy/alt-text-and-captions.csv"

expect_dimensions "shared-brand/current-social-profile/profile-current-complex-alpha-512.png" 512 512
expect_dimensions "shared-brand/current-social-profile/profile-alternate-simplified-opaque-512.png" 512 512
expect_no_alpha "shared-brand/current-social-profile/profile-alternate-simplified-opaque-512.png"
expect_dimensions "youtube/banner/candidate-2560x1440-safe-area-unverified.png" 2560 1440
expect_dimensions "android-app/google-play/feature-graphic-1024x500.png" 1024 500
expect_no_alpha "android-app/google-play/feature-graphic-1024x500.png"
expect_dimensions "x/header/vehicle-vitals-header-1500x500.png" 1500 500
expect_no_alpha "x/header/vehicle-vitals-header-1500x500.png"
expect_dimensions "facebook/cover/vehicle-vitals-cover-master-1640x624.png" 1640 624
expect_dimensions "facebook/cover/vehicle-vitals-cover-820x312.png" 820 312
expect_dimensions "reddit/banner/vehicle-vitals-community-banner-1080x128.png" 1080 128

for spec in square-1080x1080 portrait-1080x1350 story-1080x1920; do
  expect_file "shared-content/templates/social-posts/vehicle-vitals-$spec.svg"
  expect_file "shared-content/templates/social-posts/vehicle-vitals-$spec.png"
done
expect_dimensions "shared-content/templates/social-posts/vehicle-vitals-square-1080x1080.png" 1080 1080
expect_dimensions "shared-content/templates/social-posts/vehicle-vitals-portrait-1080x1350.png" 1080 1350
expect_dimensions "shared-content/templates/social-posts/vehicle-vitals-story-1080x1920.png" 1080 1920
expect_dimensions "shared-content/templates/carousel/carousel-cover-1080x1350.png" 1080 1350
expect_dimensions "shared-content/templates/carousel/cta-end-card-1080x1350.png" 1080 1350
expect_dimensions "shared-content/templates/video/vertical-video-overlay-1080x1920.png" 1080 1920

for slug in maintenance-planning vin-lookup ownership-history cross-platform-access help-center; do
  expect_file "shared-content/video/vertical-feature-clips/$slug-1080x1920.mp4"
  expect_file "shared-content/video/vertical-feature-clips/$slug.srt"
  expect_video_dimensions "shared-content/video/vertical-feature-clips/$slug-1080x1920.mp4" 1080 1920
done

while IFS= read -r file; do
  expect_dimensions "ios-app/app-store/iphone-6.5-inch-1242x2688/$(basename "$file")" 1242 2688
  expect_no_alpha "ios-app/app-store/iphone-6.5-inch-1242x2688/$(basename "$file")"
done < <(find "$library_root/ios-app/app-store/iphone-6.5-inch-1242x2688" -type f -name '*.png' | sort)

if find "$library_root" -type f \( -iname '*DO-NOT-UPLOAD*' -o -path '*/invalid/*' \) | grep -q .; then
  echo "FAIL quarantined media was copied into the library"
  failures=$((failures + 1))
fi

if [[ "$failures" -ne 0 ]]; then
  echo "Media library validation failed: $failures problem(s)"
  exit 1
fi

python3 "$repo_root/scripts/media-library/validate-unified-media-library.py"

echo "Media library validation passed."
