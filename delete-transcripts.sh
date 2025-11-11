#!/bin/sh
# delete-daily-transcripts.sh — deletes ALL Daily transcripts (irreversible)
# Requirements: curl, jq
# Usage:
#   export DAILY_API_KEY="sk_..."
#   sh delete-daily-transcripts.sh
# Optional: export SLEEP_BETWEEN_DELETES=0.4  # throttle

set -eu
API="https://api.daily.co/v1"
SLEEP="${SLEEP_BETWEEN_DELETES:-0.6}"

[ "${DAILY_API_KEY:-}" ] || { echo "Set DAILY_API_KEY first." >&2; exit 1; }

page() {
  start_after="${1:-}"
  url="$API/transcript?limit=100"
  [ -n "$start_after" ] && url="$url&starting_after=$start_after"
  out="$(mktemp)"; code="$(curl -sS -w '%{http_code}' -H "Authorization: Bearer $DAILY_API_KEY" "$url" -o "$out" || true)"
  [ "$code" = "200" ] || { echo "LIST FAILED ($code)"; cat "$out"; rm -f "$out"; exit 1; }
  cat "$out"; rm -f "$out"
}

resp="$(page "")"
total="$(echo "$resp" | jq -r '.total_count // 0')"
count="$(echo "$resp" | jq -r '.data|length')"
echo "total_count=$total, first_page=$count"
[ "$count" -eq 0 ] && { echo "No transcripts found."; exit 0; }

last=""
while : ; do
  [ -n "$last" ] && resp="$(page "$last")"

  # Extract the correct identifier (transcriptId), fallback to id if present
  ids="$(echo "$resp" | jq -r '.data[]? | (.transcriptId // .id) | select(type=="string" and length>0)')"
  [ -z "$ids" ] && { echo "Done."; break; }

  echo "$ids" | while IFS= read -r tid; do
    [ -n "$tid" ] || continue
    printf 'Deleting transcript %s ... ' "$tid"
    code="$(curl -sS -o /dev/null -w '%{http_code}' -X DELETE \
      -H "Authorization: Bearer $DAILY_API_KEY" \
      "$API/transcript/$tid" || true)"
    echo "$code" | grep -qE '^2' && echo "ok" || echo "FAILED ($code)"
    sleep "$SLEEP"
  done

  last="$(printf '%s\n' "$ids" | tail -n1)"
done

echo "All transcripts deleted."
