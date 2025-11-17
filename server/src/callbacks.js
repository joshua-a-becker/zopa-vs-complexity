import { ClassicListenersCollector } from "@empirica/core/admin/classic";
import fetch from "node-fetch";
import rolesData from "./roles.json" assert { type: "json" };

const roles = rolesData.roles;

export const Empirica = new ClassicListenersCollector();


// Empirica.onRoundEnded(({round})=>{
// })

Empirica.onGameStart(({ game }) => {


  // Create Daily.co room for this game
  (async () => {
    const DAILY_API_KEY = "d9ff4a046f2a0c3571efa7655fbf80907ad2ffd4d7c89cae0a89e89424d63642";
    const roomName = `${game.id}_video_room`;

    console.log("Creating Daily.co room for game:", game.id);
    try {
      const roomExp = Math.round(Date.now() / 1000) + 60 * 60 * 4; // 4 hour expiry

      // Create the Daily room
      const res = await fetch("https://api.daily.co/v1/rooms", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DAILY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: roomName,
          properties: {
            exp: roomExp,
            enable_recording: "cloud",
            enable_transcription_storage: true,
          },
        }),
      });

      const data = await res.json();

      if (!data.url) {
        console.error("Failed to create Daily room:", data);
        return;
      }

      // Save the room URL to the game
      game.set("roomUrl", data.url);
      Empirica.flush();
      console.log(`Room created for game: ${data.url}`);

      console.log("Creating meeting tokens for players");
      // Create meeting tokens for each player with transcription permissions
      const tokenPromises = game.players.map(async (player) => {
        try {
          const displayName = player.get("displayName") 
          const user_name = player.get("displayName")  + " - " + `Player ${player.id}`;

          const tokenRes = await fetch("https://api.daily.co/v1/meeting-tokens", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${DAILY_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              properties: {
                room_name: roomName,
                user_name: user_name,
                user_id: player.id,
                is_owner: false,
                permissions: {
                  canAdmin: ["transcription"]
                },
                exp: roomExp,
              },
            }),
          });

          const tokenData = await tokenRes.json();

          if (tokenData.token) {
            player.set("dailyMeetingToken", tokenData.token);
            Empirica.flush();
            console.log(`Created token for player ${displayName}`);
          } else {
            console.error(`Failed to create token for player ${displayName}:`, tokenData);
          }
        } catch (err) {
          console.error(`Error creating token for player ${player.id}:`, err);
        }
      });

      await Promise.all(tokenPromises);
      Empirica.flush();
      console.log(`Tokens generated for ${game.players.length} players`);
    } catch (error) {
      console.error("Failed to create Daily room or tokens:", error);
    }
  })();


  // STANDARD GAME SETUP HERE

  const readRoleTime = game.get("treatment")?.readRoleTime ?? 300;
  const negotiateTime = game.get("treatment")?.negotiateTime ?? 1800;

  // Roles are now imported from roles.js at the top of the file
  console.log(`Loaded ${roles.length} roles from roles.js`);

  // Randomly assign roles to players
  // Shuffle players array
  const players = [...game.players];
  for (let i = players.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [players[i], players[j]] = [players[j], players[i]];
  }

  // Assign roles by cycling through roles array
  // Store role data in individual player variables for client access
  players.forEach((player, index) => {
    if (roles.length > 0) {
      const assignedRole = roles[index % roles.length];
      player.set("roleName", assignedRole.role_name);
      player.set("roleNarrative", assignedRole.narrative);
      player.set("roleScoresheet", assignedRole.scoresheet);
      player.set("roleBATNA", assignedRole.BATNA);
      player.set("roleRP", assignedRole.RP);
      console.log(`Assigned role "${assignedRole.role_name}" to player ${player.id}`);
    } else {
      console.warn(`No roles available to assign to player ${player.id}`);
    }
  });


  // Initialize participant timestamps for presence tracking via Daily.co API
  game.set("participantTimestamps", {});

  // initialize rounds and stages
    // ROUND 1 -- Assign actual task based on flipOrder
  const round = game.addRound({
    name: "Negotiation Game",
  });

    // ROUND 2 STAGE 1 -- TASK DESCRIPTION
  round.addStage({
    name: "Read Negotiation Role",
    duration: readRoleTime,
  });

  round.addStage({
    name: "Time To Negotiate",
    duration: negotiateTime,
  });

  console.log("game started?")

});

// Handle stage start for video stages
Empirica.onStageStart(({ stage }) => {
  
  console.log("stage starting")

  // this code block keeps track of whether players have left the game
  // piggybacking on daily.co tracking
  // Initialize timestamps for all players at stage start
  const game = stage.round.currentGame;
  const initialTimestamps = {};
  game.players.forEach(player => {
    initialTimestamps[player.id] = Date.now();
  });
  game.set("participantTimestamps", initialTimestamps);
  Empirica.flush();

  // Monitor Daily.co participant presence every 5 seconds
  const monitorInterval = setInterval(async () => {

    const currentGame = stage.round.currentGame;
    const currentStage = currentGame.currentStage;

    // Check if we're still on the stage that created this interval
    if (!currentStage || currentStage.id !== stage.id) {
      return; // This interval is for an old stage, don't run
    }

    const game = stage.round.currentGame;
    const timestamps = game.get("participantTimestamps") || {};
    const now = Date.now();

    // Get Daily.co participants to update timestamps
    const DAILY_API_KEY = "4a8717f69efe0168244b69d4d4aa0aad4faafbe31c94d69853d590eeeb916290";
    const roomUrl = game.get("roomUrl");

    if (roomUrl) {
      try {
        // Extract room name from URL (e.g., "https://company.daily.co/roomname" -> "roomname")
        const roomName = roomUrl.split('/').pop();

        // Fetch current participants from Daily.co presence API
        const res = await fetch(`https://api.daily.co/v1/rooms/${roomName}/presence`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${DAILY_API_KEY}`,
          }
        });

        const data = await res.json();


        if (data && data.data) {
          // Get list of player IDs currently in the call

          const activePlayerIds = data.data.map(p => p.userId);

          game.set("activeDailyCalls", data.data)

          // Update timestamps for players who are in the Daily call
          game.players.forEach(player => {
            if (activePlayerIds.includes(player.id)) {
              // LOOK HERE FOR MYSTERY
              // console.log(player.id + " is active")
              timestamps[player.id] = now;
              // console.log(timestamps)
            }
          });

          // Save updated timestamps
          // console.log("Saved timestamps:", timestamps);
          game.set("participantTimestamps", timestamps);
          Empirica.flush();
          // Object.entries(game.get("participantTimestamps")).forEach(([k,v]) => console.log(k + " : " + ((v-Date.now())/1000) ))
        }
      } catch (error) {
        console.error("Error fetching Daily participants:", error);
        // Continue with existing timestamps if API call fails
      }
    }

    // Calculate threshold based on stage and time remaining
    let threshold = 15000; // Default 30 seconds
    const stageTask = stage.get("task");
    const stageEndTime = stage.get("endAt");
    const timeRemaining = stageEndTime ? stageEndTime - now : null;
    
    game.players.forEach(player => {
      const lastSeen = timestamps[player.id];
    
      if (lastSeen && (now - lastSeen) > threshold) {
        const displayName = player.get("displayName") || "Unknown";
        
        // do something here if a player has left
        
      }
    });
  }, 5000);

});