import React, { useEffect } from "react";

import { usePlayer } from "@empirica/core/player/classic/react";

export function AutoPlayerIdForm({ onPlayerID }) {
    const urlParams = new URLSearchParams(window.location.search);
    const paramsObj = Object.fromEntries(urlParams?.entries());
    const playerIdFromUrl = paramsObj?.participantKey || "undefined";


    useEffect(() => {
      console.log(`Auto-submitting ID ${playerIdFromUrl} from URL parameter "participantKey"`);
      onPlayerID(playerIdFromUrl);
    }, [playerIdFromUrl]);

  }