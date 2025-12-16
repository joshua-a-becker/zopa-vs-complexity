import React, { useState, useEffect, useContext, useMemo } from "react";
import { Users, Video, Clock, Play } from "lucide-react";
import { usePlayer, useGame } from "@empirica/core/player/classic/react";
import { DailyCallContext } from "../App.jsx";
import { VideoChat } from "../components/VideoChat.jsx";

export function CustomLobby() {
  const [tips, setTips] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  const player = usePlayer();
  const game = useGame();
  const { groupName: contextGroupName } = useContext(DailyCallContext);

  // Get player's groupName (from URL params set on player, or from context)
  const myGroupName = player?.get("groupName") || contextGroupName || "default";

  // Get waitingPlayers from game (stored by server since usePlayers() doesn't work in lobby)
  const waitingPlayersObj = game?.get("waitingPlayers") || {};

  // Check if current player is admin of their group
  const groupAdmins = game?.get("groupAdmins") || {};
  const isAdmin = groupAdmins[myGroupName] === player?.id;

  // Debug logging
  console.log("[CustomLobby] My player ID:", player?.id);
  console.log("[CustomLobby] My groupName:", myGroupName);
  console.log("[CustomLobby] isAdmin:", isAdmin);
  console.log("[CustomLobby] waitingPlayers from game:", waitingPlayersObj);

  // Filter players to show only those in the same group (excluding self)
  const groupMembers = useMemo(() => {
    const members = [];
    for (const [playerId, playerInfo] of Object.entries(waitingPlayersObj)) {
      const theirGroupName = playerInfo.groupName || "default";
      const isInMyGroup = theirGroupName === myGroupName;
      const isNotMe = playerId !== player?.id;

      if (isInMyGroup && isNotMe) {
        members.push({ id: playerId, ...playerInfo });
      }
    }
    return members;
  }, [waitingPlayersObj, myGroupName, player?.id]);

  // Create a Set of player IDs for video filtering
  const groupMemberIds = useMemo(() => {
    const ids = new Set();
    groupMembers.forEach(p => ids.add(p.id));
    return ids;
  }, [groupMembers]);

  // Check if video chat is available (room URL and token exist)
  const hasVideoRoom = game?.get("roomUrl") && player?.get("dailyMeetingToken");
  const hasCompletedIntro = player?.get("introDone");

  // Get role data URL for tips
  const rolesUrl = game?.get("treatment")?.roleDataURL;

  // Handle start game button click
  const handleStartGame = () => {
    if (!isAdmin || !game) return;
    game.set("startGroup", {
      groupName: myGroupName,
      playerId: player.id,
    });
  };

  // Update current time every second (for countdown display)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch tips if available
  useEffect(() => {
    if (rolesUrl) {
      fetch(rolesUrl)
        .then(res => res.json())
        .then(data => setTips(data.tips || ""))
        .catch(err => console.error("Failed to fetch tips:", err));
    }
  }, [rolesUrl]);

  // Calculate time until 6 PM EST
  const getTimeUntil6PM = () => {
    const now = currentTime;
    const estOptions = { timeZone: 'America/New_York', hour: 'numeric', minute: 'numeric', hour12: false };
    const estTime = now.toLocaleTimeString('en-US', estOptions);
    const [hours, minutes] = estTime.split(':').map(Number);

    const targetHour = 18; // 6 PM
    let hoursUntil = targetHour - hours;
    let minutesUntil = -minutes;

    if (minutesUntil < 0) {
      hoursUntil -= 1;
      minutesUntil += 60;
    }

    if (hoursUntil < 0) {
      return "Game starting soon...";
    }

    if (hoursUntil === 0 && minutesUntil <= 0) {
      return "Game starting soon...";
    }

    return `${hoursUntil}h ${minutesUntil}m until game starts`;
  };

  return (
    <div className="h-screen w-screen bg-gray-100 flex">
      {/* Left sidebar - Info */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col p-6 overflow-y-auto">
        {/* Group header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <Users className="w-10 h-10 text-blue-500" strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-1">
            {myGroupName}
          </h1>
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{getTimeUntil6PM()}</span>
          </div>
        </div>

        {/* Start button for admin */}
        {isAdmin && (
          <button
            onClick={handleStartGame}
            className="w-full mb-6 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            <Play className="w-5 h-5" />
            Start Game
          </button>
        )}

        {/* Group members list */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Members ({groupMembers.length + 1})
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>{player?.get("displayName") || "You"} (You){isAdmin && " - Admin"}</span>
            </div>
            {groupMembers.map(p => (
              <div key={p.id} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>{p.displayName || "Anonymous"}</span>
              </div>
            ))}
            {groupMembers.length === 0 && (
              <p className="text-xs text-gray-400 italic">
                Waiting for teammates...
              </p>
            )}
          </div>
        </div>

        {/* Waiting info */}
        <div className="text-sm text-gray-600 mb-6">
          <p className="mb-2">
            {isAdmin
              ? "Click 'Start Game' when everyone is ready."
              : "Waiting for the group admin to start the game."}
          </p>
          <p className="text-xs text-gray-400">
            Game will auto-start at 6:00 PM EST if not started manually.
          </p>
        </div>

        {/* Tips section */}
        {tips && (
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">While You Wait...</h3>
            <div className="prose prose-sm max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: tips }} />
          </div>
        )}
      </div>

      {/* Main area - Video chat */}
      <div className="flex-1 p-4">
        {hasVideoRoom && hasCompletedIntro ? (
          <div className="h-full rounded-lg overflow-hidden">
            <VideoChat defaultHideSelf={false} filterPlayerIds={groupMemberIds} />
          </div>
        ) : (
          <div className="h-full bg-gray-200 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Video className="w-16 h-16 mx-auto mb-3 opacity-50" />
              <p className="text-lg">
                {!hasCompletedIntro
                  ? "Complete intro to enable video chat"
                  : "Setting up video room..."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
