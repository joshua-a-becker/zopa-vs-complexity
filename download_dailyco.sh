#!/bin/bash

# Daily.co API Recording & Transcript Downloader - FIXED VERSION
# Downloads TRANSCRIPTS FIRST, then RECORDINGS
# WARNING: Replace the API key below with your own and keep it secure!

API_KEY="d9ff4a046f2a0c3571efa7655fbf80907ad2ffd4d7c89cae0a89e89424d63642"
BASE_URL="https://api.daily.co/v1"
OUTPUT_DIR="./daily_recordings"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Create output directories
mkdir -p "$OUTPUT_DIR/recordings"
mkdir -p "$OUTPUT_DIR/transcripts"
mkdir -p "$OUTPUT_DIR/metadata"

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Daily.co Video and Transcript Downloader${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Check for required tools
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is not installed. Please install it first:${NC}"
    echo "  Ubuntu/Debian: sudo apt-get install jq"
    echo "  MacOS: brew install jq"
    exit 1
fi

# Calculate today's date boundaries (Unix timestamps)
TODAY_START=$(date -u -j -f '%Y-%m-%d %H:%M:%S' "$(date -u '+%Y-%m-%d') 00:00:00" '+%s')
TODAY_END=$((TODAY_START + 86400))

echo -e "${CYAN}Date filter: Only downloading from $(date -u -r $TODAY_START '+%Y-%m-%d')${NC}"
echo ""

# Counters
RECORDING_SUCCESS=0
TRANSCRIPT_SUCCESS=0
RECORDING_SKIPPED=0
TRANSCRIPT_SKIPPED=0

# Array to store today's meeting session IDs (for matching transcripts)
declare -a TODAY_SESSION_IDS

#########################################
# PART 1: Download Recordings (FIRST - to collect session IDs)
#########################################

echo -e "${YELLOW}Fetching recordings from today...${NC}"

download_transcripts() {
    local starting_after=""
    local has_more=true
    local page=0
    local total_found=0
    local finished_count=0
    local in_progress_count=0
    
    while [ "$has_more" = true ]; do
        ((page++))
        
        local url="${BASE_URL}/transcript?limit=100"
        if [ -n "$starting_after" ]; then
            url="${url}&starting_after=${starting_after}"
        fi
        
        local response=$(curl -s -X GET "$url" \
          -H "Authorization: Bearer ${API_KEY}" \
          -H "Content-Type: application/json")
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}Error: Failed to fetch transcripts${NC}"
            return 1
        fi
        
        local count=$(echo "$response" | jq '.data | length' 2>/dev/null || echo "0")
        
        if [ "$count" -eq 0 ]; then
            break
        fi
        
        total_found=$((total_found + count))
        
        # Count statuses in this batch
        local batch_finished=$(echo "$response" | jq '[.data[] | select(.status == "t_finished")] | length')
        local batch_in_progress=$(echo "$response" | jq '[.data[] | select(.status == "t_in_progress")] | length')
        
        finished_count=$((finished_count + batch_finished))
        in_progress_count=$((in_progress_count + batch_in_progress))
        
        echo "Processing page $page: $count transcripts ($batch_finished finished, $batch_in_progress in progress)"
        
        # Process only finished transcripts with VTT available
        echo "$response" | jq -r '.data[] | select(.status == "t_finished" and .isVttAvailable == true) | @json' | while read -r transcript_json; do
            local transcript_id=$(echo "$transcript_json" | jq -r '.transcriptId')
            local room_name=$(echo "$transcript_json" | jq -r '.roomName // "unknown"')
            local duration=$(echo "$transcript_json" | jq -r '.duration // 0')
            local mtg_session=$(echo "$transcript_json" | jq -r '.mtgSessionId // "unknown"')

            # Skip if not matching today's recording sessions
            local session_match=false
            for session_id in "${TODAY_SESSION_IDS[@]}"; do
                if [ "$mtg_session" = "$session_id" ]; then
                    session_match=true
                    break
                fi
            done

            if [ "$session_match" = false ]; then
                ((TRANSCRIPT_SKIPPED++))
                continue
            fi

            echo ""
            echo -e "${CYAN}Transcript: ${room_name}${NC}"
            echo "  ID: $transcript_id"
            echo "  Duration: ${duration}s"
            echo "  Session: $mtg_session"
            
            # Save metadata
            echo "$transcript_json" > "$OUTPUT_DIR/metadata/${transcript_id}_transcript_meta.json"
            
            # Get download link
            local access_response=$(curl -s -X GET \
              "${BASE_URL}/transcript/${transcript_id}/access-link" \
              -H "Authorization: Bearer ${API_KEY}" \
              -H "Content-Type: application/json")

            # Rate limit after API call
            sleep 0.2

            local download_url=$(echo "$access_response" | jq -r '.link // empty')
            local error_msg=$(echo "$access_response" | jq -r '.error // empty')
            
            if [ -n "$error_msg" ] && [ "$error_msg" != "null" ]; then
                echo -e "  ${RED}❌ Error: $error_msg${NC}"
                local info=$(echo "$access_response" | jq -r '.info // ""')
                if [ -n "$info" ]; then
                    echo -e "  ${RED}   Info: $info${NC}"
                fi
                continue
            fi
            
            if [ -n "$download_url" ] && [ "$download_url" != "null" ]; then
                # Create filename - transcripts are VTT format
                local filename="${room_name}_${transcript_id}.vtt"
                filename=$(echo "$filename" | tr '/' '_' | tr ' ' '_' | tr ':' '-')
                
                echo -e "  ${GREEN}📝 Downloading transcript...${NC}"
                if curl -L -f -s -o "$OUTPUT_DIR/transcripts/$filename" "$download_url"; then
                    echo -e "  ${GREEN}✅ Saved: $filename${NC}"
                    
                    # Also save the full transcript data as JSON
                    local transcript_data=$(curl -s -X GET \
                      "${BASE_URL}/transcript/${transcript_id}" \
                      -H "Authorization: Bearer ${API_KEY}" \
                      -H "Content-Type: application/json")

                    # Rate limit after API call
                    sleep 0.2

                    if [ $? -eq 0 ]; then
                        local json_filename="${room_name}_${transcript_id}.json"
                        json_filename=$(echo "$json_filename" | tr '/' '_' | tr ' ' '_' | tr ':' '-')
                        echo "$transcript_data" > "$OUTPUT_DIR/transcripts/$json_filename"
                    fi
                else
                    echo -e "  ${RED}❌ Download failed${NC}"
                fi
            else
                echo -e "  ${YELLOW}⚠️  No download link available${NC}"
            fi
        done
        
        starting_after=$(echo "$response" | jq -r '.data[-1].transcriptId // empty')
        
        if [ -z "$starting_after" ] || [ "$starting_after" = "null" ]; then
            has_more=false
        fi
        
        # Rate limiting
        sleep 0.5
    done
    
    echo ""
    echo "Total transcripts found: $total_found"
    echo "  Finished: $finished_count"
    echo "  In progress: $in_progress_count"
}

# Temporarily skip transcripts - will do after recordings

#########################################
# PART 2: Download Transcripts (matching today's recordings)
#########################################

download_recordings() {
    local starting_after=""
    local has_more=true
    local page=0
    
    while [ "$has_more" = true ]; do
        ((page++))
        
        local url="${BASE_URL}/recordings?limit=100"
        if [ -n "$starting_after" ]; then
            url="${url}&starting_after=${starting_after}"
        fi
        
        local response=$(curl -s -X GET "$url" \
          -H "Authorization: Bearer ${API_KEY}" \
          -H "Content-Type: application/json")
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}Error: Failed to fetch recordings${NC}"
            return 1
        fi
        
        local count=$(echo "$response" | jq '.data | length' 2>/dev/null || echo "0")
        
        if [ "$count" -eq 0 ]; then
            break
        fi
        
        echo "Processing page $page ($count recordings)..."
        
        echo "$response" | jq -r '.data[] | @json' | while read -r recording_json; do
            local recording_id=$(echo "$recording_json" | jq -r '.id')
            local room_name=$(echo "$recording_json" | jq -r '.room_name // "unknown"')
            local start_ts=$(echo "$recording_json" | jq -r '.start_ts // 0')
            local status=$(echo "$recording_json" | jq -r '.status // "unknown"')
            local duration=$(echo "$recording_json" | jq -r '.duration // 0')
            local mtg_session=$(echo "$recording_json" | jq -r '.mtgSessionId // "unknown"')

            # Skip if not from today
            if [ "$start_ts" -lt "$TODAY_START" ] || [ "$start_ts" -ge "$TODAY_END" ]; then
                ((RECORDING_SKIPPED++))
                continue
            fi

            # Store session ID for transcript matching
            TODAY_SESSION_IDS+=("$mtg_session")

            echo ""
            echo -e "${CYAN}Recording: ${room_name}${NC}"
            echo "  ID: $recording_id"
            echo "  Status: $status"
            echo "  Duration: ${duration}s"
            echo "  Date: $(date -r $start_ts '+%Y-%m-%d %H:%M:%S')"

            # Save metadata
            echo "$recording_json" > "$OUTPUT_DIR/metadata/${recording_id}_recording.json"

            # Skip if not finished
            if [ "$status" != "finished" ]; then
                echo -e "  ${YELLOW}⏭  Skipping (status: $status)${NC}"
                continue
            fi
            
            # Get download link
            local access_response=$(curl -s -X GET \
              "${BASE_URL}/recordings/${recording_id}/access-link" \
              -H "Authorization: Bearer ${API_KEY}" \
              -H "Content-Type: application/json")

            # Rate limit after API call
            sleep 0.2

            local download_url=$(echo "$access_response" | jq -r '.download_link // empty')
            
            if [ -n "$download_url" ] && [ "$download_url" != "null" ]; then
                local filename="${room_name}_${start_ts}_${recording_id}.mp4"
                filename=$(echo "$filename" | tr '/' '_' | tr ' ' '_' | tr ':' '-')
                
                echo -e "  ${GREEN}📥 Downloading video...${NC}"
                if curl -L -f -s -o "$OUTPUT_DIR/recordings/$filename" "$download_url"; then
                    echo -e "  ${GREEN}✅ Saved: $filename${NC}"
                else
                    echo -e "  ${RED}❌ Download failed${NC}"
                fi
            else
                echo -e "  ${YELLOW}⚠️  No download link available${NC}"
            fi
        done
        
        starting_after=$(echo "$response" | jq -r '.data[-1].id // empty')
        
        if [ -z "$starting_after" ] || [ "$starting_after" = "null" ]; then
            has_more=false
        fi
        
        # Rate limiting - be nice to the API
        sleep 0.5
    done
}

download_recordings

# Count results
RECORDING_SUCCESS=$(find "$OUTPUT_DIR/recordings" -name "*.mp4" 2>/dev/null | wc -l | tr -d ' ')

echo ""
echo -e "${GREEN}Recordings phase complete!${NC}"
echo "  Downloaded: $RECORDING_SUCCESS videos"
echo "  Skipped (not from today): $RECORDING_SKIPPED"
echo "  Today's session IDs collected: ${#TODAY_SESSION_IDS[@]}"
echo ""

#########################################
# Now download transcripts matching today's recordings
#########################################

echo -e "${YELLOW}Fetching transcripts matching today's recordings...${NC}"

download_transcripts

# Count results
TRANSCRIPT_SUCCESS=$(find "$OUTPUT_DIR/transcripts" -name "*.vtt" 2>/dev/null | wc -l | tr -d ' ')

echo ""
echo -e "${GREEN}Transcripts phase complete!${NC}"
echo "  Downloaded: $TRANSCRIPT_SUCCESS transcripts"
echo "  Skipped (not from today): $TRANSCRIPT_SKIPPED"
echo ""

echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}Download Complete!${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

echo "Files saved to:"
echo -e "  ${CYAN}📁 Recordings:${NC} $OUTPUT_DIR/recordings/"
echo -e "  ${CYAN}📁 Transcripts:${NC} $OUTPUT_DIR/transcripts/"
echo -e "  ${CYAN}📁 Metadata:${NC} $OUTPUT_DIR/metadata/"
echo ""

echo "Summary:"
echo -e "  ${GREEN}📝 Transcripts downloaded:${NC} $TRANSCRIPT_SUCCESS"
echo -e "  ${GREEN}🎥 Videos downloaded:${NC} $RECORDING_SUCCESS"
echo ""