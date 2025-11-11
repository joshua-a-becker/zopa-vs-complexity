import React from "react";
import { usePlayer, useGame } from "@empirica/core/player/classic/react";
import { VideoChat } from "./VideoChat";
import { Chat } from "@empirica/core/player/classic/react";

export function VideoNegotiate() {
  const player = usePlayer();
  const game = useGame();
  const role = player.get("role");

  if (!role) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-gray-500">Loading your role...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex">
      {/* Left side: Video and Chat side-by-side (1/2 of screen) */}
      <div className="w-1/2 flex border-r border-gray-300">
        {/* Video takes up 2/3 of left side */}
        <div className="w-2/3 overflow-hidden">
          <VideoChat />
        </div>
        {/* Chat takes up 1/3 of left side */}
        <div className="w-1/3 border-l border-gray-300">
          <Chat scope={game} attribute="chat" />
        </div>
      </div>

      {/* Right side: Role info (1/2 of screen) */}
      <div className="w-1/2 overflow-auto bg-gray-50 p-6">
        {/* Narrative at top */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Your Role: {role.role_name}
          </h3>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {role.narrative}
            </p>
          </div>
        </div>

        {/* Scoresheet at bottom */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Your Scoresheet</h3>
          <div className="space-y-6">
            {Object.entries(role.scoresheet).map(([category, options]) => (
              <div key={category} className="border-b border-gray-200 pb-4 last:border-b-0">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">
                  {category.replace(/_/g, " ")}
                </h4>
                <div className="space-y-2">
                  {options.map((opt, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded"
                    >
                      <span className="text-gray-700 font-medium">{opt.option}</span>
                      <span className="text-blue-600 font-bold text-lg">{opt.score} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
