#!/bin/bash

mkdir -p recordings
mkdir -p transcripts

# Today's UTC timestamps
TODAY_START=$(date -u -j -f '%Y-%m-%d %H:%M:%S' "$(date -u '+%Y-%m-%d') 00:00:00" '+%s')
TODAY_END=$((TODAY_START + 86400))

API_KEY="d9ff4a046f2a0c3571efa7655fbf80907ad2ffd4d7c89cae0a89e89424d63642"
BASE_URL="https://api.daily.co/v1"

# Get all recordings
RECORDINGS_JSON=$(curl -s -H "Content-Type: application/json" \
                       -H "Authorization: Bearer $API_KEY" \
                       "$BASE_URL/recordings")

# Build a list of mtgSessionIds for today's recordings
echo "GETTING LIST OF TODAYS RECORDINGS"
today_ids=$(echo "$RECORDINGS_JSON" | jq -r '.data[] | select(.start_ts >= '"$TODAY_START"' and .start_ts <= '"$TODAY_END"') | .mtgSessionId')

# Get all transcripts
echo "GETTING LIST OF ALL TRANSCRIPTS"
TRANSCRIPTS_JSON=$(curl -s -H "Authorization: Bearer $API_KEY" "$BASE_URL/transcript")

# Download today's transcripts
echo "DOWNLOADING TODAYS TRANSCRIPTS, NEW ONLY"
echo "$TRANSCRIPTS_JSON" | jq -c '.data[]' | while read -r t; do
    transcript_id=$(echo "$t" | jq -r '.transcriptId')
    mtgSessionId=$(echo "$t" | jq -r '.mtgSessionId')

    TARGET_FILE="./transcripts/${transcript_id}.vtt"

    # Only download if session is in today's recordings
    if echo "$today_ids" | grep -q "^$mtgSessionId$"; then
        [[ -f "$TARGET_FILE" ]] && continue
        echo "Downloading transcript: $transcript_id"
        LINK=$(curl -s -H "Content-Type: application/json" \
                    -H "Authorization: Bearer $API_KEY" \
                    "$BASE_URL/transcript/$transcript_id/access-link" \
            | jq -r '.link')

        curl -s -o "./transcripts/${transcript_id}.vtt" "$LINK"
        sleep 0.2
    fi
done

# Download today's recordings
echo "DOWNLOADING TODAYS RECORDINGS, NEW ONLY"
echo "$RECORDINGS_JSON" | jq -c '.data[]' | while read -r rec; do
    mtgSessionId=$(echo "$rec" | jq -r '.mtgSessionId')
    start_ts=$(echo "$rec" | jq -r '.start_ts')
    RECORDING_ID=$(echo "$rec" | jq -r '.id')

    TARGET_FILE="./recordings/${RECORDING_ID}.recording"

    # Only download if it's from today
    if [[ "$start_ts" -ge "$TODAY_START" && "$start_ts" -le "$TODAY_END" ]]; then
        [[ -f "$TARGET_FILE" ]] && continue
        echo "Downloading recording: $RECORDING_ID"
        LINK=$(curl -s -H "Content-Type: application/json" \
            -H "Authorization: Bearer $API_KEY" \
            "$BASE_URL/recordings/$RECORDING_ID/access-link" \
            | jq -r '.download_link')

        curl -s -o "./recordings/${RECORDING_ID}.recording" "$LINK"
        sleep 0.2
    fi
done

echo "DONE."
