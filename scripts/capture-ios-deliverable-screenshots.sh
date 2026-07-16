#!/usr/bin/env bash

set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
MOBILE_DIR="$ROOT/packages/mobile"
DATE=${VV_SCREENSHOT_DATE:-$(date +%F)}
OUTPUT_ROOT=${VV_IOS_SCREENSHOT_OUTPUT:-"$ROOT/output/playwright/vehicle-vitals-$DATE/ios/iphone-17-pro-max"}
BUNDLE_ID=${VV_IOS_BUNDLE_ID:-com.vehiclevitals.app.ios}
DEMO_VIN=${VV_SCREENSHOT_VIN:-1FTEW1EP8NFA23457}
SCOPE=${VV_IOS_SCREENSHOT_SCOPE:-all}

if [[ "$SCOPE" != "all" && "$SCOPE" != "signed-out" && "$SCOPE" != "signed-in" ]]; then
  echo "VV_IOS_SCREENSHOT_SCOPE must be all, signed-out, or signed-in." >&2
  exit 1
fi

find_default_device() {
  xcrun simctl list devices available | awk '
    /^-- iOS / { runtime=$0 }
    /iPhone 17 Pro Max/ && /Shutdown|Booted/ { candidate=$0 }
    END {
      if (candidate != "") {
        match(candidate, /\([0-9A-F-]+\)/)
        print substr(candidate, RSTART + 1, RLENGTH - 2)
      }
    }
  '
}

DEVICE_UDID=${VV_IOS_DEVICE_UDID:-$(find_default_device)}
if [[ -z "$DEVICE_UDID" ]]; then
  echo "No available iPhone 17 Pro Max simulator was found." >&2
  exit 1
fi

mkdir -p "$OUTPUT_ROOT/signed-out" "$OUTPUT_ROOT/signed-in"

boot_device() {
  xcrun simctl boot "$DEVICE_UDID" 2>/dev/null || true
  open -ga Simulator
  xcrun simctl bootstatus "$DEVICE_UDID" -b
  xcrun simctl status_bar "$DEVICE_UDID" override \
    --time '9:41' \
    --batteryState charged \
    --batteryLevel 100 \
    --wifiBars 3 \
    --cellularBars 4
}

build_and_install() {
  local signed_out=$1
  local defines=(--dart-define=VV_SCREENSHOT_MODE=true)
  if [[ "$signed_out" == "true" ]]; then
    defines+=(--dart-define=VV_SCREENSHOT_SIGNED_OUT=true)
  fi

  (
    cd "$MOBILE_DIR"
    flutter build ios --simulator --debug "${defines[@]}"
  )
  xcrun simctl install "$DEVICE_UDID" "$MOBILE_DIR/build/ios/iphonesimulator/Runner.app"
}

capture_route() {
  local scope=$1
  local id=$2
  local route=$3
  local wait_seconds=${4:-3.5}
  local output="$OUTPUT_ROOT/$scope/$id.png"

  xcrun simctl launch --terminate-running-process \
    "$DEVICE_UDID" "$BUNDLE_ID" "--route=$route" >/dev/null
  sleep "$wait_seconds"
  xcrun simctl io "$DEVICE_UDID" screenshot --type=png "$output" >/dev/null
  local manifest_tmp
  manifest_tmp=$(mktemp)
  awk -F, -v scope="$scope" -v id="$id" \
    'NR == 1 || !($2 == scope && $3 == id)' \
    "$OUTPUT_ROOT/manifest.csv" > "$manifest_tmp"
  mv "$manifest_tmp" "$OUTPUT_ROOT/manifest.csv"
  printf 'ios,%s,%s,%s,%s\n' "$scope" "$id" "$route" "${output#$ROOT/}" >> "$OUTPUT_ROOT/manifest.csv"
  echo "  captured $scope/$id.png"
}

boot_device
if [[ "$SCOPE" == "all" || ! -f "$OUTPUT_ROOT/manifest.csv" ]]; then
  printf 'platform,scope,id,route,file\n' > "$OUTPUT_ROOT/manifest.csv"
fi

if [[ "$SCOPE" == "all" || "$SCOPE" == "signed-out" ]]; then
  echo '[iOS] signed-out routes'
  build_and_install true
  capture_route signed-out welcome /welcome 6
  capture_route signed-out login /auth/login
  capture_route signed-out signup /auth/signup
  capture_route signed-out forgot-password /auth/forgot-password
fi

if [[ "$SCOPE" == "all" || "$SCOPE" == "signed-in" ]]; then
  echo '[iOS] signed-in routes with deterministic demo data'
  build_and_install false
  capture_route signed-in garage /app 6
  capture_route signed-in vehicle-detail "/app/vehicle/$DEMO_VIN"
  capture_route signed-in add-vehicle /app/add-vehicle
  capture_route signed-in add-vehicle-prefilled "/app/add-vehicle/$DEMO_VIN"
  capture_route signed-in edit-vehicle "/app/edit-vehicle/$DEMO_VIN"
  capture_route signed-in records "/app/records/$DEMO_VIN"
  capture_route signed-in scan-vin /app/scan-vin
  capture_route signed-in maintenance-list "/app/maintenance/$DEMO_VIN"
  capture_route signed-in maintenance-detail "/app/maintenance/$DEMO_VIN/oil-service"
  capture_route signed-in account /app/profile
  capture_route signed-in settings /app/settings
  capture_route signed-in data-privacy /app/data-privacy
  capture_route signed-in email-preferences /app/email-preferences
  capture_route signed-in support /app/support
  capture_route signed-in privacy /app/privacy
  capture_route signed-in terms /app/terms
  capture_route signed-in instructions /app/instructions
  capture_route signed-in calendar-preferences /app/calendar-preferences
  capture_route signed-in reminder-preferences /app/reminder-preferences
  capture_route signed-in shops-services /app/service-providers
  capture_route signed-in premium /app/premium
  capture_route signed-in offline-settings /app/offline-settings
  capture_route signed-in maintenance-plan /app/upcoming
  capture_route signed-in service-history /app/timeline
fi

xcrun simctl status_bar "$DEVICE_UDID" clear || true
echo "Captured $(tail -n +2 "$OUTPUT_ROOT/manifest.csv" | wc -l | tr -d ' ') iOS screenshots."
echo "Manifest: $OUTPUT_ROOT/manifest.csv"
