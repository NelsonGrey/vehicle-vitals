#!/usr/bin/env bash
# Publishes the Google Play store listing (title, descriptions, icon) via
# the Android Publisher API. Adapted from modulo-squares' script of the
# same name/purpose (see that repo's scripts/store-promo/publish-play-listing.sh
# for the original write-up of the auth gotcha below).
#
# Source content lives at
# packages/mobile/android/fastlane/metadata/android/en-US/ (the same
# directory layout fastlane's own `supply` action expects), so updating the
# listing later is just editing those files and re-running this. Feature
# graphic and phone screenshots are intentionally not part of this pass --
# no properly-sized (1024x500 / Play-aspect-ratio) source art exists yet in
# this repo; only title/descriptions/icon are pushed. Re-run with those
# files added once real store art exists -- the upload loop below already
# handles any image type placed in the images/ directory.
#
# Auth gotcha (cost real time to work out on modulo-squares, confirmed to
# reproduce identically here): `gcloud auth print-access-token
# --impersonate-service-account=...` silently drops any --scopes flag. The
# fix is to operate on the *directly activated* service account identity
# (gcloud auth activate-service-account --key-file=... once, ahead of time)
# and pass --scopes explicitly on print-access-token.
#
# Usage: scripts/store-promo/publish-play-listing.sh
#   Requires either:
#     - a service account already activated via `gcloud auth
#       activate-service-account --key-file=...` (check `gcloud auth list`), or
#     - GOOGLE_PLAY_SERVICE_ACCOUNT_JSON set to the service account's JSON
#       key content (as GitHub Actions provides it), in which case this
#       script activates it itself.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
METADATA="$REPO_ROOT/packages/mobile/android/fastlane/metadata/android/en-US"
PACKAGE_NAME="com.vehiclevitals.app.android"
API="https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}"
UPLOAD_API="https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/${PACKAGE_NAME}"

SA_ACCOUNT="${GOOGLE_PLAY_SA_ACCOUNT:-}"

if [ -n "${GOOGLE_PLAY_SERVICE_ACCOUNT_JSON:-}" ]; then
  KEY_FILE="$(mktemp)"
  trap 'rm -f "$KEY_FILE"' EXIT
  printf '%s' "$GOOGLE_PLAY_SERVICE_ACCOUNT_JSON" > "$KEY_FILE"
  SA_ACCOUNT="$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['client_email'])" "$KEY_FILE")"
  gcloud auth activate-service-account "$SA_ACCOUNT" --key-file="$KEY_FILE"
elif [ -z "$SA_ACCOUNT" ]; then
  echo "Set GOOGLE_PLAY_SERVICE_ACCOUNT_JSON (key content) or GOOGLE_PLAY_SA_ACCOUNT (pre-activated account email)." >&2
  exit 1
fi

TOKEN=$(gcloud auth print-access-token --account="$SA_ACCOUNT" --scopes=https://www.googleapis.com/auth/androidpublisher)

curl_json() {
  curl -sf -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" "$@"
}

echo "Opening a new edit..."
EDIT_ID=$(curl_json -X POST "$API/edits" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")
echo "Edit ID: $EDIT_ID"

echo "Updating en-US listing text..."
curl_json -X PUT "$API/edits/$EDIT_ID/listings/en-US" -d @- <<JSON
{
  "language": "en-US",
  "title": $(python3 -c "import json,sys; print(json.dumps(open(sys.argv[1]).read().strip()))" "$METADATA/title.txt"),
  "shortDescription": $(python3 -c "import json,sys; print(json.dumps(open(sys.argv[1]).read().strip()))" "$METADATA/short_description.txt"),
  "fullDescription": $(python3 -c "import json,sys; print(json.dumps(open(sys.argv[1]).read()))" "$METADATA/full_description.txt")
}
JSON

upload_image() {
  local image_type="$1"
  local file_path="$2"
  echo "Uploading $image_type: $(basename "$file_path")"
  curl -sf -H "Authorization: Bearer $TOKEN" -H "Content-Type: image/png" \
    -X POST --data-binary "@$file_path" \
    "$UPLOAD_API/edits/$EDIT_ID/listings/en-US/$image_type" > /dev/null
}

if [ -f "$METADATA/images/icon.png" ]; then
  # Icon is a singleton -- clear existing before re-upload so re-runs don't
  # just append duplicates.
  curl_json -X DELETE "$API/edits/$EDIT_ID/listings/en-US/icon" > /dev/null 2>&1 || true
  upload_image "icon" "$METADATA/images/icon.png"
else
  echo "No icon.png found at $METADATA/images/ -- skipping icon upload."
fi

if [ -f "$METADATA/images/featureGraphic.png" ]; then
  curl_json -X DELETE "$API/edits/$EDIT_ID/listings/en-US/featureGraphic" > /dev/null 2>&1 || true
  upload_image "featureGraphic" "$METADATA/images/featureGraphic.png"
fi

if compgen -G "$METADATA/images/phoneScreenshots/*.png" > /dev/null; then
  curl_json -X DELETE "$API/edits/$EDIT_ID/listings/en-US/phoneScreenshots" > /dev/null 2>&1 || true
  for shot in "$METADATA"/images/phoneScreenshots/*.png; do
    upload_image "phoneScreenshots" "$shot"
  done
fi

echo "Committing edit..."
curl_json -X POST "$API/edits/$EDIT_ID:commit" | python3 -c "import json,sys; d=json.load(sys.stdin); print('Committed edit', d.get('id'))"

echo "Verifying via read-back..."
VERIFY_EDIT=$(curl_json -X POST "$API/edits" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")
curl_json "$API/edits/$VERIFY_EDIT/listings/en-US" | python3 -m json.tool
curl_json -X DELETE "$API/edits/$VERIFY_EDIT" > /dev/null 2>&1 || true

echo "Play Store listing published and verified."
