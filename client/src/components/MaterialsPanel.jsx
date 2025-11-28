import React, { useState, useRef } from "react";
import Markdown from "react-markdown";

export function MaterialsPanel({
  roleName,
  roleNarrative,
  roleScoresheet,
  roleBATNA,
  roleRP
}) {
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

  return (
    <div className="w-[70%] bg-gray-300 p-6 flex flex-col relative">
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
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Your Role: {roleName}
              </h3>
              <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed">
                <Markdown>{roleNarrative}</Markdown>
              </div>
            </div>

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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-xl font-bold text-blue-900 mb-3">Your Scoresheet</h3>

              {/* Column Headers */}
              <div className="flex items-center px-4 py-2 mb-1">
                <span className="text-xs font-bold text-gray-700 uppercase flex-shrink-0 w-[200px]">
                  Feature
                </span>
                <span className="text-xs font-bold text-gray-700 uppercase flex-shrink-0 w-[80px] text-center">
                  Points
                </span>
                <span className="text-xs font-bold text-gray-700 uppercase flex-1 ml-4">
                  Reason
                </span>
              </div>

              <div className="space-y-2">
                {Object.entries(roleScoresheet).map(([category, options]) => {
                  // Get the "Include" option (index 0) - skip "Exclude" since it's always 0
                  const includeOption = options[0];
                  return (
                    <div key={category} className="flex items-center bg-white rounded px-4 py-2.5 border border-blue-300">
                      <span className="text-sm font-semibold text-gray-800 flex-shrink-0 w-[200px]">
                        {category.replace(/_/g, " ")}
                      </span>
                      <span className="text-blue-600 font-bold text-base flex-shrink-0 w-[80px] text-center">
                        {includeOption.score >= 0 ? '+' : ''}{includeOption.score} pts
                      </span>
                      <span className="text-sm text-gray-600 flex-1 ml-4">
                        {includeOption.reason}
                      </span>
                    </div>
                  );
                })}
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
  );
}
