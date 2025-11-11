import {
  usePlayer,
  usePlayers,
  useStage,
} from "@empirica/core/player/classic/react";
import { Loading } from "@empirica/core/player/react";
import React from "react";
import { ReadRole } from "./components/ReadRole";
import { VideoNegotiate } from "./components/VideoNegotiate";

export function Stage() {
  const player = usePlayer();
  const players = usePlayers();
  const stage = useStage();

  if (player.stage.get("submit")) {
    if (players.length === 1) {
      return <Loading />;
    }

    return (
      <div className="text-center text-gray-400 pointer-events-none">
        Please wait for other player(s).
      </div>
    );
  }

  const stageName = stage.get("name");

  // Render component based on stage name
  if (stageName === "Read Negotiation Role") {
    return <ReadRole />;
  }

  if (stageName === "Time To Negotiate") {
    return <VideoNegotiate />;
  }

  // Default fallback
  return (
    <div className="text-center text-gray-400">
      Unknown stage: {stageName}
    </div>
  );
}
