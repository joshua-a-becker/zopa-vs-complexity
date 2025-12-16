import { ClassicListenersCollector } from "@empirica/core/admin/classic";
import fetch from "node-fetch";
import { execSync } from "child_process";

// import rolesData from "./roles.json" assert { type: "json" };
// const roles = rolesData.roles;

export const Empirica = new ClassicListenersCollector();

// Daily.co API key for creating rooms and tokens
const DAILY_API_KEY = "d9ff4a046f2a0c3571efa7655fbf80907ad2ffd4d7c89cae0a89e89424d63642";

// Store context reference for polling and assignment
let globalCtx = null;
let pollingStarted = false;

// Configuration
const ASSIGNMENT_TIMEZONE = "America/New_York";
const ASSIGNMENT_HOUR = 18; // 6 PM
const ASSIGNMENT_MINUTE = 0;

// Helper function to create Daily.co room for waiting game
async function createDailyRoom(roomName) {
  const roomExp = Math.round(Date.now() / 1000) + 60 * 60 * 8; // 8 hour expiry

  try {
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
      console.error("[DAILY] Failed to create room:", data);
      return null;
    }
    console.log(`[DAILY] Room created: ${data.url}`);
    return { url: data.url, roomName, expiry: roomExp };
  } catch (error) {
    console.error("[DAILY] Error creating room:", error);
    return null;
  }
}

// Helper function to create meeting token for a player
async function createMeetingToken(roomName, player, expiry) {
  try {
    const displayName = player.get("displayName") || "Anonymous";
    const userName = `${displayName} - Player ${player.id}`;

    const res = await fetch("https://api.daily.co/v1/meeting-tokens", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          user_name: userName,
          user_id: player.id,
          is_owner: false,
          permissions: {
            canAdmin: ["transcription"]
          },
          exp: expiry,
        },
      }),
    });

    const tokenData = await res.json();
    if (tokenData.token) {
      console.log(`[DAILY] Created token for player ${displayName}`);
      return tokenData.token;
    } else {
      console.error(`[DAILY] Failed to create token for ${displayName}:`, tokenData);
      return null;
    }
  } catch (err) {
    console.error(`[DAILY] Error creating token for player ${player.id}:`, err);
    return null;
  }
}

// Helper function to create waiting game with Daily.co room
async function createWaitingGame(ctx, batch) {
  const games = Array.from(ctx.scopesByKind("game").values());
  const existingWaitingGame = games.find(g =>
    g.get("batchID") === batch.id &&
    g.get("isWaiting") === true &&
    !g.get("hasEnded")
  );

  if (existingWaitingGame) {
    console.log(`[BATCH] Waiting game already exists for batch ${batch.id}`);
    return existingWaitingGame;
  }

  // Create Daily.co room for waiting game
  const d = new Date();
  const today = `${d.getFullYear()}_${String(d.getMonth()+1).padStart(2,'0')}_${String(d.getDate()).padStart(2,'0')}`;
  const roomName = `waiting_room_${batch.id}_${today}`;

  const roomData = await createDailyRoom(roomName);

  // Create waiting game with large playerCount so it never auto-starts
  const waitingGame = batch.addGame([
    {
      key: "treatment",
      value: { playerCount: 1000 },
      immutable: true
    },
    { key: "batchID", value: batch.id },  // CRITICAL: Set batchID for lookup
    { key: "isWaiting", value: true },
    { key: "name", value: "Waiting Room" },
    { key: "roomUrl", value: roomData?.url || null },
    { key: "dailyRoomName", value: roomData?.roomName || null },
    { key: "dailyRoomExpiry", value: roomData?.expiry || null },
  ]);

  console.log(`[BATCH] Created waiting game for batch ${batch.id} with Daily room: ${roomData?.url}`);
  return waitingGame;
}

// Check if it's time to trigger assignment (18:00 in configured timezone)
function isAssignmentTime() {
  const now = new Date();
  const options = { timeZone: ASSIGNMENT_TIMEZONE, hour: 'numeric', minute: 'numeric', hour12: false };
  const timeStr = now.toLocaleTimeString('en-US', options);
  const [hour, minute] = timeStr.split(':').map(Number);

  return hour === ASSIGNMENT_HOUR && minute === ASSIGNMENT_MINUTE;
}

// Group players by groupName
function groupByGroupName(players) {
  const groups = {};
  for (const player of players) {
    const groupName = player.get("groupName") || "default";
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(player);
  }
  return groups;
}

// Main assignment function - groups players by groupName and creates games
async function assignPlayersToGames(ctx) {
  console.log("[ASSIGNMENT] Running assignment algorithm...");

  // Get all games and waiting players
  const allGames = Array.from(ctx.scopesByKind("game").values());
  const waitingPlayers = Array.from(ctx.scopesByKind("player").values())
    .filter(p => {
      const game = allGames.find(g => g.id === p.get("gameID"));
      return p.get("introDone") &&
             !p.get("ended") &&
             game &&
             game.get("isWaiting") === true;
    });

  console.log(`[ASSIGNMENT] Total players waiting: ${waitingPlayers.length}`);

  if (waitingPlayers.length === 0) {
    console.log("[ASSIGNMENT] No players to assign");
    return;
  }

  // Get running batch
  const batches = Array.from(ctx.scopesByKind("batch").values())
    .filter(b => b.get("status") === "running");

  if (batches.length === 0) {
    console.log("[ASSIGNMENT] No running batches");
    return;
  }

  const batch = batches[0];
  const smallGroupMode = batch.get("smallGroupMode") || "skip";

  // Get treatment from batch config for playerCount
  const config = batch.get("config");
  const playerCount = config?.treatments?.[0]?.factors?.playerCount || 4;

  console.log(`[ASSIGNMENT] Small group mode: ${smallGroupMode}, playerCount: ${playerCount}`);

  // Group players by groupName
  const groups = groupByGroupName(waitingPlayers);
  console.log(`[ASSIGNMENT] Found ${Object.keys(groups).length} groups:`, Object.keys(groups).map(k => `${k}(${groups[k].length})`));

  // Process each group
  const processedPlayers = new Set();

  for (const [groupName, members] of Object.entries(groups)) {
    // Skip already processed players
    const unprocessed = members.filter(p => !processedPlayers.has(p.id));

    if (unprocessed.length === 0) continue;

    if (unprocessed.length >= playerCount) {
      // Full group - assign normally
      const toAssign = unprocessed.slice(0, playerCount);
      await createAndAssignGame(ctx, batch, toAssign, groupName);
      toAssign.forEach(p => processedPlayers.add(p.id));

    } else if (smallGroupMode === "undersize") {
      // Create game with fewer players
      await createAndAssignGame(ctx, batch, unprocessed, groupName);
      unprocessed.forEach(p => processedPlayers.add(p.id));

    } else if (smallGroupMode === "oversize") {
      // Pull extra players from other groups
      const needed = playerCount - unprocessed.length;
      const extras = findExtraPlayers(groups, needed, groupName, processedPlayers);
      const toAssign = [...unprocessed, ...extras];

      if (toAssign.length > 0) {
        await createAndAssignGame(ctx, batch, toAssign, groupName);
        toAssign.forEach(p => processedPlayers.add(p.id));
      }
    }
    // "skip" mode: do nothing for incomplete groups
  }

  console.log(`[ASSIGNMENT] Assignment complete. Processed ${processedPlayers.size} players.`);
}

// Find extra players from other groups to fill a game
function findExtraPlayers(groups, needed, excludeGroup, processedPlayers) {
  const extras = [];

  for (const [groupName, members] of Object.entries(groups)) {
    if (groupName === excludeGroup) continue;

    for (const player of members) {
      if (!processedPlayers.has(player.id) && extras.length < needed) {
        extras.push(player);
      }
    }

    if (extras.length >= needed) break;
  }

  return extras;
}

// Create a real game and assign players to it
async function createAndAssignGame(ctx, batch, players, groupName) {
  console.log(`[ASSIGNMENT] Creating game for group "${groupName}" with ${players.length} players`);

  // Get treatment from batch
  const config = batch.get("config");
  const treatment = config?.treatments?.[0];

  // Create new game
  const game = batch.addGame([
    {
      key: "treatment",
      value: treatment?.factors || { playerCount: players.length },
      immutable: true
    },
    { key: "batchID", value: batch.id },  // Set batchID for consistency
    { key: "treatmentName", value: treatment?.name || "default" },
    { key: "groupName", value: groupName },
    { key: "isWaiting", value: false },
  ]);

  console.log(`[ASSIGNMENT] Created game ${game.id} for group "${groupName}"`);

  // Assign players to game
  for (const player of players) {
    await game.assignPlayer(player);
    console.log(`[ASSIGNMENT] Assigned player ${player.id} (${player.get("displayName")}) to game ${game.id}`);
  }

  // Start the game
  game.set("start", true);
  Empirica.flush();

  console.log(`[ASSIGNMENT] Game ${game.id} started with ${players.length} players`);
}

// ============================================================================
// BATCH EVENTS - Create waiting game when batch starts
// ============================================================================

Empirica.on("batch", async (ctx, { batch }) => {
  console.log(`[BATCH] Batch ${batch.id} created with status: ${batch.get("status")}`);

  const status = batch.get("status");
  if (status === "created" || status === "running") {
    await createWaitingGame(ctx, batch);
  }
});

Empirica.on("batch", "status", async (ctx, { batch }) => {
  const status = batch.get("status");
  console.log(`[BATCH] Batch ${batch.id} status changed to: ${status}`);

  if (status === "running") {
    await createWaitingGame(ctx, batch);
  }
});

// Listen for manual assignment trigger (all groups)
Empirica.on("batch", "triggerAssignment", async (ctx, { batch }) => {
  const trigger = batch.get("triggerAssignment");
  if (trigger) {
    console.log(`[BATCH] Manual assignment triggered for batch ${batch.id}`);
    await assignPlayersToGames(ctx);
    batch.set("triggerAssignment", false);
    Empirica.flush();
  }
});

// Listen for single group start trigger from group admin
Empirica.on("game", "startGroup", async (ctx, { game }) => {
  const startGroup = game.get("startGroup");
  if (!startGroup || !game.get("isWaiting")) return;

  const groupName = startGroup.groupName;
  const requestingPlayerId = startGroup.playerId;

  console.log(`[GAME] Start requested for group "${groupName}" by player ${requestingPlayerId}`);

  // Verify requester is admin
  const groupAdmins = game.get("groupAdmins") || {};
  if (groupAdmins[groupName] !== requestingPlayerId) {
    console.log(`[GAME] Player ${requestingPlayerId} is not admin of group "${groupName}", ignoring`);
    game.set("startGroup", null);
    Empirica.flush();
    return;
  }

  // Get players in this group
  const waitingPlayers = game.get("waitingPlayers") || {};
  const groupMembers = Object.values(waitingPlayers).filter(p => p.groupName === groupName);

  if (groupMembers.length === 0) {
    console.log(`[GAME] No players in group "${groupName}"`);
    game.set("startGroup", null);
    Empirica.flush();
    return;
  }

  console.log(`[GAME] Starting game for group "${groupName}" with ${groupMembers.length} players`);

  // Get the batch
  const batch = Array.from(ctx.scopesByKind("batch").values())
    .find(b => b.id === game.get("batchID"));

  if (!batch) {
    console.log(`[GAME] Could not find batch for game`);
    game.set("startGroup", null);
    Empirica.flush();
    return;
  }

  // Get actual player objects
  const allPlayers = Array.from(ctx.scopesByKind("player").values());
  const playersToAssign = groupMembers
    .map(gm => allPlayers.find(p => p.id === gm.id))
    .filter(p => p);

  // Create and assign game for this group
  await createAndAssignGame(ctx, batch, playersToAssign, groupName);

  // Remove these players from waitingPlayers
  for (const p of playersToAssign) {
    delete waitingPlayers[p.id];
  }
  game.set("waitingPlayers", waitingPlayers);

  // Remove admin for this group
  delete groupAdmins[groupName];
  game.set("groupAdmins", groupAdmins);

  game.set("startGroup", null);
  Empirica.flush();
});

// ============================================================================
// PLAYER EVENTS - Assign to waiting game and handle groupName
// ============================================================================

Empirica.on("player", async (ctx, { player }) => {
  // Start polling on first player connection
  if (!pollingStarted) {
    globalCtx = ctx;
    pollingStarted = true;

    // Poll every minute to check for 18:00 assignment time
    setInterval(async () => {
      if (isAssignmentTime()) {
        console.log("[POLLING] Assignment time reached (18:00)!");
        await assignPlayersToGames(globalCtx);
      }
    }, 60000); // Check every minute

    console.log("[POLLING] Started polling for assignment time");
  }

  console.log(`[PLAYER] Player ${player.id} connected`);

  // Skip if player already assigned to a game
  if (player.get("gameID")) {
    console.log(`[PLAYER] Player ${player.id} already has gameID: ${player.get("gameID")}`);
    return;
  }

  // Get running batches
  const batches = Array.from(ctx.scopesByKind("batch").values())
    .filter(b => b.get("status") === "running");

  if (batches.length === 0) {
    console.log(`[PLAYER] No running batches found for player ${player.id}`);
    return;
  }

  const batch = batches[0];
  console.log(`[PLAYER] Using batch ${batch.id}`);

  // Find or create waiting game
  const allGames = Array.from(ctx.scopesByKind("game").values());
  console.log(`[PLAYER] Total games in system: ${allGames.length}`);

  // Debug: log all games and their properties
  allGames.forEach(g => {
    console.log(`[PLAYER] Game ${g.id}: batchID=${g.get("batchID")}, isWaiting=${g.get("isWaiting")}, hasEnded=${g.get("hasEnded")}, players=${g.players?.length || 0}`);
  });

  // First try to find waiting game by batchID
  let waitingGame = allGames.find(g =>
    g.get("batchID") === batch.id &&
    g.get("isWaiting") === true &&
    !g.get("hasEnded")
  );

  // Fallback: find ANY waiting game that isn't ended (for backwards compat with existing games)
  if (!waitingGame) {
    console.log(`[PLAYER] No waiting game found by batchID, trying fallback...`);
    waitingGame = allGames.find(g =>
      g.get("isWaiting") === true &&
      !g.get("hasEnded")
    );
  }

  console.log(`[PLAYER] Found waiting game: ${waitingGame ? waitingGame.id : 'NONE'}`);

  if (!waitingGame) {
    console.log(`[PLAYER] No waiting game found for batch ${batch.id}, creating one...`);
    waitingGame = await createWaitingGame(ctx, batch);
    console.log(`[PLAYER] Created waiting game: ${waitingGame ? waitingGame.id : 'FAILED'}`);
  }

  if (!waitingGame) {
    console.log(`[PLAYER] Could not create waiting game for player ${player.id}`);
    return;
  }

  // Assign player to waiting game
  console.log(`[PLAYER] Assigning player ${player.id} to waiting game ${waitingGame.id}`);
  await waitingGame.assignPlayer(player);

  // Store player info on the waiting game for client-side visibility
  // (usePlayers() doesn't work reliably in lobby context)
  const waitingPlayers = waitingGame.get("waitingPlayers") || {};
  const playerGroupName = player.get("groupName") || "default";
  waitingPlayers[player.id] = {
    id: player.id,
    displayName: player.get("displayName") || "Anonymous",
    groupName: playerGroupName,
    joinedAt: Date.now(),
  };
  waitingGame.set("waitingPlayers", waitingPlayers);

  // Track admin per group - first person in a group becomes admin
  const groupAdmins = waitingGame.get("groupAdmins") || {};
  if (!groupAdmins[playerGroupName]) {
    groupAdmins[playerGroupName] = player.id;
    waitingGame.set("groupAdmins", groupAdmins);
    console.log(`[PLAYER] Player ${player.id} is now admin of group "${playerGroupName}"`);
  }

  Empirica.flush();
  console.log(`[PLAYER] Updated waitingPlayers on game, now ${Object.keys(waitingPlayers).length} players`);

  // Create meeting token for player if room exists
  const roomName = waitingGame.get("dailyRoomName");
  const roomExpiry = waitingGame.get("dailyRoomExpiry");

  if (roomName && roomExpiry) {
    const token = await createMeetingToken(roomName, player, roomExpiry);
    if (token) {
      player.set("dailyMeetingToken", token);
      Empirica.flush();
    }
  }
});

// Listen for groupName changes and update waitingPlayers on the game
Empirica.on("player", "groupName", async (ctx, { player }) => {
  const newGroupName = player.get("groupName") || "default";
  console.log(`[PLAYER] Player ${player.id} set groupName to: ${newGroupName}`);

  // Update waitingPlayers on the game so client can see the change
  const gameId = player.get("gameID");
  if (gameId) {
    const game = Array.from(ctx.scopesByKind("game").values())
      .find(g => g.id === gameId);

    if (game && game.get("isWaiting")) {
      const waitingPlayers = game.get("waitingPlayers") || {};
      const oldGroupName = waitingPlayers[player.id]?.groupName;

      if (waitingPlayers[player.id]) {
        waitingPlayers[player.id].groupName = newGroupName;
        waitingPlayers[player.id].displayName = player.get("displayName") || "Anonymous";
        game.set("waitingPlayers", waitingPlayers);
      }

      // Update group admins
      const groupAdmins = game.get("groupAdmins") || {};

      // If player was admin of old group, reassign admin to next person in that group
      if (oldGroupName && groupAdmins[oldGroupName] === player.id) {
        const nextAdmin = Object.values(waitingPlayers).find(
          p => p.groupName === oldGroupName && p.id !== player.id
        );
        if (nextAdmin) {
          groupAdmins[oldGroupName] = nextAdmin.id;
          console.log(`[PLAYER] Reassigned admin of group "${oldGroupName}" to ${nextAdmin.id}`);
        } else {
          delete groupAdmins[oldGroupName];
          console.log(`[PLAYER] Removed admin for empty group "${oldGroupName}"`);
        }
      }

      // If new group has no admin, make this player admin
      if (!groupAdmins[newGroupName]) {
        groupAdmins[newGroupName] = player.id;
        console.log(`[PLAYER] Player ${player.id} is now admin of group "${newGroupName}"`);
      }

      game.set("groupAdmins", groupAdmins);
      Empirica.flush();
      console.log(`[PLAYER] Updated waitingPlayers for player ${player.id} with groupName: ${newGroupName}`);
    }
  }
});

// Listen for displayName changes and update waitingPlayers on the game
Empirica.on("player", "displayName", async (ctx, { player }) => {
  const displayName = player.get("displayName");
  console.log(`[PLAYER] Player ${player.id} set displayName to: ${displayName}`);

  // Update waitingPlayers on the game so client can see the change
  const gameId = player.get("gameID");
  if (gameId) {
    const game = Array.from(ctx.scopesByKind("game").values())
      .find(g => g.id === gameId);

    if (game && game.get("isWaiting")) {
      const waitingPlayers = game.get("waitingPlayers") || {};
      if (waitingPlayers[player.id]) {
        waitingPlayers[player.id].displayName = displayName || "Anonymous";
        game.set("waitingPlayers", waitingPlayers);
        Empirica.flush();
        console.log(`[PLAYER] Updated waitingPlayers for player ${player.id} with displayName: ${displayName}`);
      }
    }
  }
});

// When player completes intro, mark them ready
Empirica.on("player", "introDone", async (ctx, { player }) => {
  if (!player.get("introDone")) return;
  console.log(`[PLAYER] Player ${player.id} completed intro`);

  // Create token if not already created (in case they completed intro before assignment)
  if (!player.get("dailyMeetingToken")) {
    const game = Array.from(ctx.scopesByKind("game").values())
      .find(g => g.id === player.get("gameID"));

    if (game && game.get("isWaiting") && game.get("dailyRoomName")) {
      const token = await createMeetingToken(
        game.get("dailyRoomName"),
        player,
        game.get("dailyRoomExpiry")
      );
      if (token) {
        player.set("dailyMeetingToken", token);
        Empirica.flush();
      }
    }
  }
});

// ============================================================================
// GAME EVENTS - Existing game start logic
// ============================================================================

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
  Empirica.flush();
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