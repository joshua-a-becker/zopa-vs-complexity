import { useGame } from "@empirica/core/player/classic/react";

import React from "react";
import { Profile } from "./Profile";
import { Stage } from "./Stage";

export function Game() {
  const game = useGame();
  const { playerCount } = game.get("treatment");

  return (
    <div className="w-full flex flex-col">
      <div className="w-full">
        <Stage profileComponent={<Profile />} />
      </div>
    </div>
  );
}
