import {
  usePlayer,
  useRound,
  useStage,
} from "@empirica/core/player/classic/react";
import React from "react";
import { Avatar } from "./components/Avatar";
import { Timer } from "./components/Timer";

export function Profile() {
  const player = usePlayer();
  const round = useRound();
  const stage = useStage();

  const score = player.get("score") || 0;

  // Dev mode skip stage handler
  const handleSkipStage = () => {
    player.stage.set("submit", true);
  };

  return (
    <div className="w-full px-3 py-2 text-gray-500 grid grid-cols-3 items-center border-b border-gray-300">
      <div className="leading-tight">
        <div className="text-gray-600 font-semibold">
          {round ? round.get("name") : ""}
        </div>
        <div className="text-empirica-500 font-medium">
          {stage ? stage.get("name") : ""}
        </div>
      </div>

      <Timer />

      <div className="flex space-x-3 items-center justify-end">
        {/* Dev-only Skip Stage button */}
        {process.env.NODE_ENV === 'development' && (
          <button
            onClick={handleSkipStage}
            className="text-white bg-red-600 px-4 py-2 text-base font-medium rounded hover:bg-red-700 transition-colors border border-red-700"
          >
            DEV: Skip Stage
          </button>
        )}

        <div className="flex flex-col items-center">
          <div className="text-xs font-semibold uppercase tracking-wide leading-none text-gray-400">
            Score
          </div>
          <div className="text-3xl font-semibold !leading-none tabular-nums">
            {score}
          </div>
        </div>
        <div className="h-11 w-11">
          <Avatar player={player} />
        </div>
      </div>
    </div>
  );
}
