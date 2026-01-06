import { ClassicListenersCollector } from "@empirica/core/admin/classic";
import fetch from "node-fetch";
import { execSync } from "child_process";

// import rolesData from "./roles.json" assert { type: "json" };
// const roles = rolesData.roles;

export const Empirica = new ClassicListenersCollector();

Empirica.onRoundEnded(({ round }) => {
  const game = round.currentGame;
  const history = round.get("proposalHistory") || [];
  const finalProposal = history.length > 0 ? history[history.length - 1] : null;

  // Check if agreement was reached (all players voted to finalize)
  const finalVotes = finalProposal?.finalVotes || {};
  const playerCount = game.get("treatment")?.playerCount || game.players.length;
  const finalVoteCount = Object.keys(finalVotes).length;
  const allFinalized = finalVoteCount === playerCount &&
                      Object.values(finalVotes).every(vote => vote === "finalize");
  const reachedAgreement = finalProposal && allFinalized;

  console.log("onRoundEnded - Agreement check:", {
    historyLength: history.length,
    finalVoteCount,
    playerCount,
    allFinalized,
    reachedAgreement
  });

  // Calculate and save bonus for each player
  game.players.forEach((player) => {
    let bonus = 0;

    if (reachedAgreement) {
      // Calculate player's score from the finalized proposal
      const roleScoresheet = player.get("roleScoresheet");
      const proposalOptions = finalProposal.options;

      if (roleScoresheet && proposalOptions) {
        bonus = Object.entries(roleScoresheet).reduce((sum, [category]) => {
          const optionIdx = proposalOptions[category] ?? 1; // Default to exclude (index 1)
          return sum + (roleScoresheet[category]?.[optionIdx]?.score || 0);
        }, 0);
      }
    } else {
      // No agreement reached, use BATNA (reservation price)
      bonus = player.get("roleRP") || 0;
    }

    player.set("bonus", bonus);
    console.log(`Player ${player.id} bonus: ${bonus} (agreement: ${reachedAgreement})`);
  });

  // Save whether agreement was reached to the round
  round.set("agreementReached", reachedAgreement);
  
});

Empirica.onGameStart(({ game }) => {


  const roleDataURL = game.get("treatment").roleDataURL;
  const rolesData = JSON.parse(execSync(`curl -s "${roleDataURL}"`).toString());
  const roles = rolesData.roles;

  // Store tips in game state for client access
  game.set("tips", rolesData.tips || "");

  console.log(`Fetched ${roles.length} roles from ${roleDataURL}`);

  // Create Daily.co room for this game
  (async () => {
    const d = new Date();
    const today = `${d.getFullYear()}_${String(d.getMonth()+1).padStart(2,'0')}_${String(d.getDate()).padStart(2,'0')}`;
    const DAILY_API_KEY = "d9ff4a046f2a0c3571efa7655fbf80907ad2ffd4d7c89cae0a89e89424d63642";
    const roomName = `${game.id}_video_room_${today}`;

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
            enable_recording: "raw-tracks",
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
      // Empirica.flush();
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
            // Empirica.flush();
            console.log(`Created token for player ${displayName}`);
          } else {
            console.error(`Failed to create token for player ${displayName}:`, tokenData);
          }
        } catch (err) {
          console.error(`Error creating token for player ${player.id}:`, err);
        }
      });

      await Promise.all(tokenPromises);
      // Empirica.flush();
      console.log(`Tokens generated for ${game.players.length} players`);
    } catch (error) {
      console.error("Failed to create Daily room or tokens:", error);
    }
  })();


  // STANDARD GAME SETUP HERE

  const readRoleTime = game.get("treatment")?.readRoleTime ?? 300;
  const negotiateTime = game.get("treatment")?.negotiateTime ?? 1800;


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
    name: "Ready To Negotiate",
    duration: 15,
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
  

  // Monitor Daily.co participant presence every 5 seconds
  
});