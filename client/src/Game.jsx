import { useGame } from "@empirica/core/player/classic/react";

import React from "react";
import { Profile } from "./Profile";
import { Stage } from "./Stage";

export function Game() {
  const game = useGame();
  const { playerCount } = game.get("treatment");

  console.log("game")

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <Stage profileComponent={<Profile />} />
      </div>
    </div>
  );
}
