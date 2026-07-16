#!/usr/bin/env bash
set -euo pipefail

# keychain-sanity.sh
# Checks and optionally repairs user keychain drift caused by CI/keychain tooling.

LOGIN_KC="$HOME/Library/Keychains/login.keychain-db"
SYSTEM_KC="/Library/Keychains/System.keychain"
BACKUP_DIR="${HOME}/.keychain-backups"
MODE="check"
QUIET="false"

usage() {
  cat <<'EOF'
Usage:
  scripts/keychain-sanity.sh --check
  scripts/keychain-sanity.sh --fix

Options:
  --check               Check current keychain health (default)
  --fix                 Backup and repair keychain defaults/search list
  --backup-dir <path>   Override backup directory (default: ~/.keychain-backups)
  --quiet               Reduce output
  -h, --help            Show this help

What it checks:
  - Default user keychain should be login.keychain-db
  - login.keychain-db should be in user search list
  - No fastlane_tmp_keychain entries should remain in user search list
  - User search list should not contain duplicate keychains
EOF
}

log() {
  if [[ "$QUIET" != "true" ]]; then
    echo "$@"
  fi
}

die() {
  echo "ERROR: $*" >&2
  exit 1
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --check)
        MODE="check"
        shift
        ;;
      --fix)
        MODE="fix"
        shift
        ;;
      --backup-dir)
        [[ $# -ge 2 ]] || die "--backup-dir requires a path"
        BACKUP_DIR="$2"
        shift 2
        ;;
      --quiet)
        QUIET="true"
        shift
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        die "Unknown argument: $1"
        ;;
    esac
  done
}

require_security() {
  command -v security >/dev/null 2>&1 || die "'security' command not found (macOS only)"
}

collect_keychain_list() {
  # Output normalized absolute paths, one per line, preserving order.
  security list-keychains -d user \
    | sed -E 's/^[[:space:]]*"(.*)"[[:space:]]*$/\1/' \
    | sed -E 's/^[[:space:]]+|[[:space:]]+$//g' \
    | grep -v '^$' || true
}

collect_default_keychain() {
  security default-keychain -d user 2>/dev/null \
    | sed -E 's/^[[:space:]]*"(.*)"[[:space:]]*$/\1/' \
    | sed -E 's/^[[:space:]]+|[[:space:]]+$//g' || true
}

is_unhealthy() {
  local default_kc="$1"
  local all_count="$2"
  local uniq_count="$3"
  local has_login="$4"
  local has_fastlane_tmp="$5"

  [[ "$default_kc" != "$LOGIN_KC" ]] && return 0
  [[ "$has_login" != "true" ]] && return 0
  [[ "$has_fastlane_tmp" == "true" ]] && return 0
  [[ "$all_count" -ne "$uniq_count" ]] && return 0
  return 1
}

run_check() {
  local default_kc
  local list_raw
  local all_count uniq_count has_login has_fastlane_tmp

  default_kc="$(collect_default_keychain)"
  list_raw="$(collect_keychain_list)"

  all_count="$(printf '%s\n' "$list_raw" | sed '/^$/d' | wc -l | tr -d ' ')"
  uniq_count="$(printf '%s\n' "$list_raw" | sed '/^$/d' | awk '!seen[$0]++' | wc -l | tr -d ' ')"

  if printf '%s\n' "$list_raw" | grep -Fxq "$LOGIN_KC"; then
    has_login="true"
  else
    has_login="false"
  fi

  if printf '%s\n' "$list_raw" | grep -q 'fastlane_tmp_keychain'; then
    has_fastlane_tmp="true"
  else
    has_fastlane_tmp="false"
  fi

  log "Default keychain: ${default_kc:-<none>}"
  log "User search list count: ${all_count} (unique: ${uniq_count})"

  if is_unhealthy "$default_kc" "$all_count" "$uniq_count" "$has_login" "$has_fastlane_tmp"; then
    log "Status: UNHEALTHY"
    [[ "$default_kc" != "$LOGIN_KC" ]] && log "- Default keychain is not login.keychain-db"
    [[ "$has_login" != "true" ]] && log "- login.keychain-db missing from search list"
    [[ "$has_fastlane_tmp" == "true" ]] && log "- fastlane_tmp_keychain entries present"
    [[ "$all_count" -ne "$uniq_count" ]] && log "- duplicate keychains present in search list"
    return 1
  fi

  log "Status: HEALTHY"
  return 0
}

run_fix() {
  local ts backup_default backup_list
  local default_before
  local list_raw
  local cleaned

  mkdir -p "$BACKUP_DIR"
  ts="$(date +%Y%m%d-%H%M%S)"
  backup_default="$BACKUP_DIR/default-$ts.txt"
  backup_list="$BACKUP_DIR/list-$ts.txt"

  security default-keychain -d user >"$backup_default" 2>&1 || true
  security list-keychains -d user >"$backup_list" 2>&1 || true

  default_before="$(collect_default_keychain)"
  list_raw="$(collect_keychain_list)"

  cleaned="$(
    printf '%s\n' "$list_raw" \
      | grep -v 'fastlane_tmp_keychain' \
      | awk '!seen[$0]++'
  )"

  # Ensure login and system keychains are always present.
  if ! printf '%s\n' "$cleaned" | grep -Fxq "$LOGIN_KC"; then
    cleaned="$LOGIN_KC
$cleaned"
  fi
  if ! printf '%s\n' "$cleaned" | grep -Fxq "$SYSTEM_KC"; then
    cleaned="$cleaned
$SYSTEM_KC"
  fi

  # Remove accidental empties introduced by formatting.
  mapfile -t final_list < <(printf '%s\n' "$cleaned" | sed '/^$/d')

  if [[ ${#final_list[@]} -eq 0 ]]; then
    die "Computed keychain list is empty; aborting repair"
  fi

  security list-keychains -d user -s "${final_list[@]}"
  security default-keychain -d user -s "$LOGIN_KC"

  log "Backups written:"
  log "- $backup_default"
  log "- $backup_list"
  log "Default before: ${default_before:-<none>}"

  run_check
}

main() {
  parse_args "$@"
  require_security

  if [[ "$MODE" == "fix" ]]; then
    run_fix
  else
    run_check
  fi
}

main "$@"
