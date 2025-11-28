import React, { useState, useRef } from "react";
import { usePlayer } from "@empirica/core/player/classic/react";
import Markdown from "react-markdown";

export function ReadRole({ profileComponent }) {
  const player = usePlayer();
  const roleName = player.get("roleName");
  const roleNarrative = player.get("roleNarrative");
  const roleScoresheet = player.get("roleScoresheet");
  const roleBATNA = player.get("roleBATNA");
  const roleRP = player.get("roleRP");
  const [showFade, setShowFade] = useState(false);
  const scrollContainerRef = useRef(null);
  const [activeTab, setActiveTab] = useState("scoresheet");
  const [selectedOptions, setSelectedOptions] = useState({});

  // Handle scroll to show/hide fade
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const scrollTop = scrollContainerRef.current.scrollTop;
      setShowFade(scrollTop > 10);
    }
  };

  // Handle tab change and scroll to top
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  if (!roleName || !roleNarrative || !roleScoresheet) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-gray-500">Loading your role...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      {/* Profile bar at top - sticky */}
      <div className="sticky top-0 z-20 bg-gray-50">
        {profileComponent}
      </div>

      {/* Fade overlay at top - only show when scrolled, positioned below profile border */}
      {showFade && (
        <div className="absolute top-[3.6rem] left-0 right-0 h-8 bg-gradient-to-b from-gray-50 to-transparent pointer-events-none z-10"></div>
      )}

      {/* Main content */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto relative"
      >
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

          {/* Right: BATNA and Scoresheet/Calculator Tabs */}
          <div className="space-y-4">
            {/* BATNA and RP Card - always visible */}
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

            {/* Tab Navigation */}
            <div className="flex gap-2">
              <button
                onClick={() => handleTabChange("scoresheet")}
                className={`px-4 py-2 rounded font-medium transition-all border ${
                  activeTab === "scoresheet"
                    ? "bg-white text-blue-600 border-blue-400 shadow"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                }`}
              >
                Your Scoresheet
              </button>
              <button
                onClick={() => handleTabChange("calculator")}
                className={`px-4 py-2 rounded font-medium transition-all border ${
                  activeTab === "calculator"
                    ? "bg-white text-blue-600 border-blue-400 shadow"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                }`}
              >
                Calculator
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "scoresheet" && (
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
            )}

            {activeTab === "calculator" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-6">
                  {/* Left column: Total display */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Points</h3>
                      <div className="text-5xl font-bold mb-4">
                        <span className="text-blue-600">
                          {Object.entries(roleScoresheet).reduce((sum, [category]) => {
                            const optionIdx = selectedOptions[category] ?? 1; // Default to exclude (index 1)
                            return sum + (roleScoresheet[category]?.[optionIdx]?.score || 0);
                          }, 0).toFixed(2)}
                        </span>
                      </div>
                      {roleRP !== undefined && (
                        <div className={`text-sm font-semibold ${
                          Object.entries(roleScoresheet).reduce((sum, [category]) => {
                            const optionIdx = selectedOptions[category] ?? 1;
                            return sum + (roleScoresheet[category]?.[optionIdx]?.score || 0);
                          }, 0) >= roleRP ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {Object.entries(roleScoresheet).reduce((sum, [category]) => {
                            const optionIdx = selectedOptions[category] ?? 1;
                            return sum + (roleScoresheet[category]?.[optionIdx]?.score || 0);
                          }, 0) >= roleRP ? '✓ Beats your BATNA!' : '✗ Below your BATNA'}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedOptions({})}
                      className="mt-6 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm font-medium"
                    >
                      Reset All
                    </button>
                  </div>

                  {/* Right column: Checkboxes */}
                  <div className="space-y-3">
                    {Object.entries(roleScoresheet).map(([category, options]) => {
                      // Get the "Include" option (should be index 0)
                      const includeOption = options[0];
                      const isChecked = selectedOptions[category] === 0;

                      return (
                        <div key={category} className="flex items-center justify-between bg-white rounded px-4 py-3 border border-blue-300">
                          <label className="flex items-center cursor-pointer flex-1">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                setSelectedOptions(prev => {
                                  if (e.target.checked) {
                                    // Check = Include (index 0)
                                    return { ...prev, [category]: 0 };
                                  } else {
                                    // Uncheck = Exclude (index 1, which is 0 points)
                                    return { ...prev, [category]: 1 };
                                  }
                                });
                              }}
                              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="ml-3 text-sm font-semibold text-gray-800">
                              {category.replace(/_/g, " ")}
                            </span>
                          </label>
                          <span className={`text-sm font-bold ml-3 ${isChecked ? 'text-blue-600' : 'text-gray-400'}`}>
                            {isChecked ? `${includeOption.score >= 0 ? '+' : ''}${includeOption.score}` : '0'} pts
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
