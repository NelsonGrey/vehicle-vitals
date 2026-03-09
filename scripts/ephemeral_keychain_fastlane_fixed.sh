#!/usr/bin/env bash
set -euo pipefail

# Deprecated: legacy credential-wrapper removed.
# This script now only executes the provided command to preserve compatibility
# with existing callers that still reference this filename.

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 \"command\""
  exit 2
fi

CMD="$1"
echo "Legacy signing wrapper is deprecated; running command directly."
eval "$CMD"
