#!/usr/bin/env bash
set -euo pipefail

# Legacy archive compatibility wrapper.
# Executes the provided command directly.

if [ "$#" -lt 1 ]; then
	echo "Usage: $0 \"command\""
	exit 2
fi

CMD="$1"
echo "Legacy signing wrapper compatibility mode; running command directly."
eval "$CMD"
