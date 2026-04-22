import { useGame } from "@empirica/core/player/classic/react";

import React from "react";
import { Profile } from "./Profile";
import { Stage } from "./Stage";
import { Heartbeat } from "./components/Heartbeat";

export function Game() {
  const game = useGame();
  const { playerCount } = game.get("treatment");

  return (
    <div className="w-full flex flex-col">
      <Heartbeat />
      <div className="w-full">
        <Stage profileComponent={<Profile />} />
      </div>
    </div>
  );
}
