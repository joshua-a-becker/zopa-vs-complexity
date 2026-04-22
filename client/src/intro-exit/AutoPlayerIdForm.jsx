import React, { useEffect } from "react";

import { usePlayer } from "@empirica/core/player/classic/react";

export function AutoPlayerIdForm({ onPlayerID }) {
    const urlParams = new URLSearchParams(window.location.search);
    const paramsObj = Object.fromEntries(urlParams?.entries());
    const playerIdFromUrl = paramsObj?.participantKey || "undefined";
    const groupNameFromUrl = paramsObj?.groupName || "default";

    const player = usePlayer();

    useEffect(() => {
      onPlayerID(playerIdFromUrl);
    }, [playerIdFromUrl]);

    // Set groupName on player object when player becomes available
    useEffect(() => {
      if (player && groupNameFromUrl) {
        console.log(`[AutoPlayerIdForm] Setting groupName to "${groupNameFromUrl}" on player ${player.id}`);
        player.set("groupName", groupNameFromUrl);
      }
    }, [player, groupNameFromUrl]);

  }