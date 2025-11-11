#!/usr/bin/env bash
# Delete ALL Daily.co recordings (irreversible)
# Usage:
#   export DAILY_API_KEY="sk_..."
#   ./delete-daily-recordings.sh

set -euo pipefail
API="https://api.daily.co/v1"
SLEEP_BETWEEN_DELETES=0.6

if [[ -z "${DAILY_API_KEY:-}" ]]; then
  echo "Set DAILY_API_KEY first." >&2
  exit 1
fi

while :; do
  data=$(curl -s -H "Authorization: Bearer $DAILY_API_KEY" "$API/recordings?limit=100")
  ids=($(echo "$data" | jq -r '.data[]?.id'))
  [[ ${#ids[@]} -eq 0 ]] && { echo "No more recordings."; break; }

  for id in "${ids[@]}"; do
    echo "Deleting $id"
    curl -s -X DELETE -H "Authorization: Bearer $DAILY_API_KEY" "$API/recordings/$id" >/dev/null
    sleep "$SLEEP_BETWEEN_DELETES"
  done
done

echo "All recordings deleted."
