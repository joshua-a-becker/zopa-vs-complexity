import React from "react";
import { usePlayer } from "@empirica/core/player/classic/react";

export function ReadRole() {
  const player = usePlayer();
  const role = player.get("role");

  if (!role) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-gray-500">Loading your role...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto bg-gray-50">
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
              Your Role: {role.role_name}
            </h3>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {role.narrative}
              </p>
            </div>
          </div>

          {/* Right: Scoresheet */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Your Scoresheet</h3>
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
    </div>
  );
}
