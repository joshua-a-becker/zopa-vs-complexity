import React from "react";
import { Button } from "../components/Button";
import { useGame } from "@empirica/core/player/classic/react";

export function NoGameExitStep({ next }) {
  const game = useGame();
  const no_game_ending_message = game.get("treatment").noGameEndingMessage || ""
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-8 md:p-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Unable to Assign You to a Game
          </h1>
          <div className="w-24 h-1 bg-indigo-600 mx-auto rounded-full"></div>
        </div>

        <div className="space-y-6">
          <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-lg">
            <p className="text-lg text-gray-700">
              We're sorry, we could not assign you to a game and didn't want to keep you waiting.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-gray-600">
            <div dangerouslySetInnerHTML={{ __html: no_game_ending_message }} />
          </div>
        </div>
      </div>
    </div>
  );
}
