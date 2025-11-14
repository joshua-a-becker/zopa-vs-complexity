import React from "react";
import { usePlayer } from "@empirica/core/player/classic/react";
import Markdown from "react-markdown";

export function ReadRole({ profileComponent }) {
  const player = usePlayer();
  const roleName = player.get("roleName");
  const roleNarrative = player.get("roleNarrative");
  const roleScoresheet = player.get("roleScoresheet");
  const roleBATNA = player.get("roleBATNA");
  const roleRP = player.get("roleRP");

  if (!roleName || !roleNarrative || !roleScoresheet) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-gray-500">Loading your role...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      {/* Profile bar at top */}
      {profileComponent}

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Instructions at top */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-blue-900 mb-3">How Classroom Negotiations Work</h2>
          <p className="text-gray-700 leading-relaxed">
            In this negotiation exercise, you will be assigned a specific role with unique objectives and priorities.
            Your goal is to reach an agreement that maximizes your score based on your role's scoresheet.
            Review your narrative carefully to understand your position, then examine the scoresheet to see how
            different outcomes affect your final score. During negotiation, work with other participants to find
            mutually beneficial solutions.
          </p>
        </div>

        {/* Two-column layout for narrative and scoresheet */}
        <div className="grid grid-cols-2 gap-8">
          {/* Left: Narrative */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Your Role: {roleName}
            </h3>
            <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed">
              <Markdown>{roleNarrative}</Markdown>
            </div>
          </div>

          {/* Right: BATNA and Scoresheet */}
          <div className="space-y-4">
            {/* BATNA and RP Card */}
            {(roleBATNA || roleRP !== undefined) && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-2">
                  What if I don't reach agreement?
                </h4>
                {roleBATNA && (
                  <p className="text-gray-700 mb-2">{roleBATNA}</p>
                )}
                {roleRP !== undefined && (
                  <p className="text-gray-700">
                    If you don't reach agreement, you will earn <span className="font-bold">{roleRP} points</span>.
                  </p>
                )}
              </div>
            )}

            {/* Scoresheet Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-2xl font-bold text-blue-900 mb-4">Your Scoresheet</h3>
              <div className="space-y-6">
                {Object.entries(roleScoresheet).map(([category, options]) => (
                  <div key={category} className="border-gray-200 pb-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-0">
                      {category.replace(/_/g, " ")}
                    </h4>
                    <div className="border border-blue-300 rounded overflow-hidden">
                      {options.map((opt, idx) => (
                        <div
                          key={idx}
                          className={`flex justify-between items-center bg-blue-100 px-3 py-1 ${
                            idx < options.length - 1 ? 'border-b border-blue-300' : ''
                          }`}
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
        </div>
      </div>
    </div>
  );
}
