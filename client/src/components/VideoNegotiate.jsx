import React, { useState, useRef } from "react";
import { usePlayer } from "@empirica/core/player/classic/react";
import { VideoChat } from "./VideoChat";
import { CustomChat } from "./CustomChat";
import Markdown from "react-markdown";

export function VideoNegotiate({ profileComponent }) {
  const player = usePlayer();
  const roleName = player.get("roleName");
  const roleNarrative = player.get("roleNarrative");
  const roleScoresheet = player.get("roleScoresheet");
  const roleBATNA = player.get("roleBATNA");
  const roleRP = player.get("roleRP");
  const [activeTab, setActiveTab] = useState("narrative");
  const [selectedOptions, setSelectedOptions] = useState({});
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const contentScrollRef = useRef(null);

  // Handle scroll to show/hide fades
  const handleContentScroll = () => {
    if (contentScrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentScrollRef.current;
      setShowTopFade(scrollTop > 10);
      setShowBottomFade(scrollTop + clientHeight < scrollHeight - 10);
    }
  };

  // Handle tab change and scroll to top
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollTop = 0;
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
    <div className="w-full h-full flex">
      {/* Left side: Profile + Video and Chat (40% of screen) - Blue background */}
      <div className="w-2/5 flex flex-col bg-blue-50 border-r border-gray-400">
        {/* Profile bar spans left side only */}
        {profileComponent}

        {/* Video and Chat row */}
        <div className="flex-1 flex overflow-hidden pl-1 pr-3 py-3 gap-2">
          {/* Video takes up slightly over half of left side */}
          <div className="w-[55%] overflow-hidden">
            <VideoChat />
          </div>
          {/* Chat takes up remaining space - floating white box on blue background */}
          <div className="w-[45%] bg-white rounded-lg shadow-md border border-blue-200 overflow-hidden">
            <CustomChat />
          </div>
        </div>
      </div>

      {/* Right side: Role info with tabs (60% of screen) - Grey background with floating cards */}
      <div className="w-3/5 bg-gray-100 p-6 flex flex-col relative">
        {/* Tab Navigation - cleaner style with all-around borders */}
        <div className="flex gap-2 mb-2 flex-shrink-0">
          <button
            onClick={() => handleTabChange("narrative")}
            className={`px-4 py-2 rounded font-medium transition-all border ${
              activeTab === "narrative"
                ? "bg-white text-blue-600 border-blue-400 shadow"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
            }`}
          >
            Narrative
          </button>
          <button
            onClick={() => handleTabChange("scoresheet")}
            className={`px-4 py-2 rounded font-medium transition-all border ${
              activeTab === "scoresheet"
                ? "bg-white text-blue-600 border-blue-400 shadow"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
            }`}
          >
            Scoresheet
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

        {/* Fade overlays */}
        {showTopFade && (
          <div className="absolute left-6 right-6 top-[4.5rem] h-8 bg-gradient-to-b from-gray-100 to-transparent pointer-events-none z-10"></div>
        )}
        {showBottomFade && (
          <div className="absolute left-6 right-6 bottom-6 h-8 bg-gradient-to-t from-gray-100 to-transparent pointer-events-none z-10"></div>
        )}

        {/* Scrollable Tab Content */}
        <div
          ref={contentScrollRef}
          onScroll={handleContentScroll}
          className="flex-1 overflow-y-auto"
        >
        {activeTab === "narrative" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Your Role: {roleName}
            </h3>
            <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed">
              <Markdown>{roleNarrative}</Markdown>
            </div>
          </div>
        )}

        {activeTab === "scoresheet" && (
          <div className="space-y-3 max-w-[500px] mx-auto">
            {/* BATNA and RP Card */}
            {(roleBATNA || roleRP !== undefined) && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h4 className="text-base font-bold text-gray-900 mb-2">
                  What if I don't reach agreement?
                </h4>
                {roleBATNA && (
                  <p className="text-sm text-gray-700 mb-1">{roleBATNA}</p>
                )}
                {roleRP !== undefined && (
                  <p className="text-sm text-gray-700">
                    If you don't reach agreement, you will earn <span className="font-bold">{roleRP} points</span>.
                  </p>
                )}
              </div>
            )}

            {/* Scoresheet Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h3 className="text-xl font-bold text-blue-900 mb-3">Your Scoresheet</h3>
              <div className="space-y-4">
                {Object.entries(roleScoresheet).map(([category, options]) => (
                  <div key={category}>
                    <h4 className="text-sm font-semibold text-gray-800 mb-1">
                      {category.replace(/_/g, " ")}
                    </h4>
                    <div className="border border-blue-300 rounded overflow-hidden">
                      {options.map((opt, idx) => (
                        <div
                          key={idx}
                          className={`flex justify-between items-center bg-blue-100 px-3 py-1.5 ${
                            idx < options.length - 1 ? 'border-b border-blue-300' : ''
                          }`}
                        >
                          <span className="text-sm text-gray-700">{opt.option}</span>
                          <span className="text-blue-600 font-bold text-base">{opt.score} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
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
                    {Object.keys(selectedOptions).length === Object.keys(roleScoresheet).length ? (
                      <span className="text-blue-600">
                        {Object.entries(selectedOptions).reduce((sum, [category, optionIdx]) => {
                          return sum + (roleScoresheet[category]?.[optionIdx]?.score || 0);
                        }, 0)}
                      </span>
                    ) : (
                      <span className="text-red-800">---</span>
                    )}
                  </div>
                  {roleRP !== undefined && Object.keys(selectedOptions).length === Object.keys(roleScoresheet).length && (
                    <div className={`text-sm font-semibold ${
                      Object.entries(selectedOptions).reduce((sum, [category, optionIdx]) => {
                        return sum + (roleScoresheet[category]?.[optionIdx]?.score || 0);
                      }, 0) >= roleRP ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {Object.entries(selectedOptions).reduce((sum, [category, optionIdx]) => {
                        return sum + (roleScoresheet[category]?.[optionIdx]?.score || 0);
                      }, 0) >= roleRP ? '✓ Beats your BATNA!' : '✗ Below your BATNA'}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedOptions({})}
                  className="mt-6 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  Reset
                </button>
              </div>

              {/* Right column: Dropdowns */}
              <div className="space-y-3">
                {Object.entries(roleScoresheet).map(([category, options]) => (
                  <div key={category}>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">
                      {category.replace(/_/g, " ")}
                    </label>
                    <select
                      value={selectedOptions[category] ?? ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSelectedOptions(prev => {
                          if (value === "") {
                            const newState = { ...prev };
                            delete newState[category];
                            return newState;
                          }
                          return { ...prev, [category]: parseInt(value) };
                        });
                      }}
                      className="w-full px-3 py-2 text-sm border border-blue-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select --</option>
                      {options.map((opt, idx) => (
                        <option key={idx} value={idx}>
                          ({opt.score >= 0 ? '+' : ''}{opt.score} pts) {opt.option}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
