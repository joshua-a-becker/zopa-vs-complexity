import React from "react";
import { usePlayer, useGame } from "@empirica/core/player/classic/react";

export function ForceQuitExitStep({ next }) {
  const player = usePlayer();
  const game = useGame();
  const forceQuitBy = game.get("forceQuitBy");
  const isQuitter = forceQuitBy === player.id;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {isQuitter
              ? "This game has been ended."
              : "This game has been ended by one of the other players."}
          </h1>
        </div>
        <button
          onClick={next}
          className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
        >
          OK
        </button>
      </div>
    </div>
  );
}
