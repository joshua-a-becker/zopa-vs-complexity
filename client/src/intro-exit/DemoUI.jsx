import React, { useState } from "react";
import Markdown from "react-markdown";

/**
 * DemoUI - A simplified UI for the demo that receives display data from parent.
 *
 * Unlike DemoMaterialsPanel, this component does NOT derive state from vote counts.
 * It simply renders what it's told to render based on displayData.
 */
export function DemoUI({
  roleName,
  roleNarrative,
  roleScoresheet,
  roleBATNA,
  roleRP,
  tips,
  displayData,
  demoState,
  onProposalSubmit,
  onVote,
  onFinalizeVote,
  onTabChange
}) {
  const [activeTab, setActiveTab] = useState("calculator");
  const [selectedOptions, setSelectedOptions] = useState({});
  const [showEmptyProposalError, setShowEmptyProposalError] = useState(false);
  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);

  const playerCount = 3; // Hardcoded for demo

  // Handle tab change
  const handleTabChange = (tab) => {
    // Call parent handler first to allow demo state machine to transition
    if (onTabChange) {
      onTabChange(tab);
    }
    setActiveTab(tab);
    window.scrollTo(0, 0);
  };

  // Calculate current total points
  const calculateTotalPoints = () => {
    return Object.entries(roleScoresheet).reduce((sum, [category]) => {
      const optionIdx = selectedOptions[category] ?? 1; // Default to exclude (index 1)
      return sum + (roleScoresheet[category]?.[optionIdx]?.score || 0);
    }, 0);
  };

  // Calculate points for a proposal
  const calculateProposalPoints = (proposalOptions) => {
    return Object.entries(roleScoresheet).reduce((sum, [category]) => {
      const optionIdx = proposalOptions[category] ?? 1;
      return sum + (roleScoresheet[category]?.[optionIdx]?.score || 0);
    }, 0);
  };

  // Handle proposal submission
  const handleSubmitProposal = () => {
    // Check if submission is blocked with a message
    if (displayData.submitBlockedMessage) {
      setShowBlockedModal(true);
      return;
    }

    // Check if submission is not allowed (but no specific message)
    if (!displayData.canSubmitProposal) {
      return;
    }

    setHasSubmittedOnce(true);

    // Check if at least one option is selected
    const hasAnySelection = Object.values(selectedOptions).some(val => val === 0);

    if (!hasAnySelection) {
      setShowEmptyProposalError(true);
      setTimeout(() => setShowEmptyProposalError(false), 3000);
      return;
    }

    if (onProposalSubmit) {
      onProposalSubmit({ ...selectedOptions });
    }

    // Switch to Proposal tab
    handleTabChange("proposal");
  };

  // Handle modifying a proposal
  const handleModifyProposal = (proposalOptions) => {
    setSelectedOptions(proposalOptions);
    handleTabChange("calculator");
  };

  // Count votes for display
  const countVotes = (votes) => {
    const accepts = Object.values(votes || {}).filter(v => v === "accept").length;
    return { accepts, total: Object.keys(votes || {}).length };
  };

  return (
    <>
      <style>{`
        @keyframes pulse-tab {
          0% {
            background-color: #fee2e2;
            color: #b91c1c;
            border-color: #f87171;
          }
          50% {
            background-color: #ffffff;
            color: #4b5563;
            border-color: #d1d5db;
          }
          100% {
            background-color: #fee2e2;
            color: #b91c1c;
            border-color: #f87171;
          }
        }
        .animate-pulse-tab {
          animation: pulse-tab 3s ease-in-out infinite;
        }
        @keyframes pulse-button-outline {
          0% {
            box-shadow: 0 0 0 4px rgba(255, 0, 0, 0.5),
                        0 0 12px 4px rgba(255, 0, 0, 0.3),
                        0 0 20px 8px rgba(255, 0, 0, 0.1);
          }
          50% {
            box-shadow: 0 0 0 0px rgba(255, 0, 0, 0),
                        0 0 0px 0px rgba(255, 0, 0, 0),
                        0 0 0px 0px rgba(255, 0, 0, 0);
          }
          100% {
            box-shadow: 0 0 0 4px rgba(255, 0, 0, 0.5),
                        0 0 12px 4px rgba(255, 0, 0, 0.3),
                        0 0 20px 8px rgba(255, 0, 0, 0.1);
          }
        }
        .animate-pulse-button {
          animation: pulse-button-outline 3s ease-in-out infinite;
          position: relative;
        }
      `}</style>
      <div className="w-full bg-gray-300 p-6 flex flex-col relative min-h-screen">
        {/* Bottom fade overlay */}
        <div className="fixed left-0 bottom-0 w-[70%] h-12 bg-gradient-to-t from-gray-300 to-transparent pointer-events-none z-10"></div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => handleTabChange("narrative")}
            className={`px-4 py-2 rounded font-medium border shadow-md ${
              activeTab === "narrative"
                ? "bg-white text-blue-600 border-blue-400 shadow"
                : demoState === "VIEW_NARRATIVE" && activeTab !== "narrative"
                ? "animate-pulse-tab"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all"
            }`}
          >
            Narrative
            {demoState === "VIEW_NARRATIVE" && activeTab !== "narrative" && (
              <span className="ml-2 inline-flex items-center justify-center w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
          <button
            onClick={() => handleTabChange("calculator")}
            className={`px-4 py-2 rounded font-medium border shadow-md ${
              activeTab === "calculator"
                ? "bg-white text-blue-600 border-blue-400 shadow"
                : demoState === "VIEW_SCORING" && activeTab !== "calculator"
                ? "animate-pulse-tab"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all"
            }`}
          >
            Scoring
            {demoState === "VIEW_SCORING" && activeTab !== "calculator" && (
              <span className="ml-2 inline-flex items-center justify-center w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
          <button
            onClick={() => handleTabChange("proposal")}
            className={`px-4 py-2 rounded font-medium transition-all border ${
              activeTab === "proposal"
                ? "bg-white text-blue-600 border-blue-400 shadow"
                : displayData.currentProposal && activeTab !== "proposal"
                ? "bg-red-100 text-red-700 border-red-400 shadow-md"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
            }`}
          >
            Proposal
            {displayData.currentProposal && (
              <span className="ml-2 inline-flex items-center justify-center w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
          <button
            onClick={() => handleTabChange("tips")}
            className={`px-4 py-2 rounded font-medium transition-all border ${
              activeTab === "tips"
                ? "bg-white text-blue-600 border-blue-400 shadow"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
            }`}
          >
            Tips
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          {activeTab === "narrative" && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Your Role</h3>
                <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed">
                  <Markdown>{roleNarrative}</Markdown>
                </div>
              </div>
            </div>
          )}

          {activeTab === "calculator" && (
            <div className="space-y-4">
              {/* BATNA Card */}
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

              {/* Main Scoring Area */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                {/* Table Header */}
                <div className="flex items-center px-4 py-2 mb-1">
                  <span className="w-8"></span>
                  <span className="text-xs font-bold text-gray-700 uppercase flex-shrink-0 w-[140px]">Feature</span>
                  <span className="text-xs font-bold text-gray-700 uppercase flex-shrink-0 w-[80px] text-center">Points</span>
                  <span className="text-xs font-bold text-gray-700 uppercase flex-1 ml-4">Reason</span>
                </div>

                {/* Main content area */}
                <div className="flex gap-6">
                  {/* Left side: Scoresheet rows */}
                  <div className="flex-[9] space-y-2">
                    {Object.entries(roleScoresheet)
                      .sort(([, optionsA], [, optionsB]) => optionsB[0].score - optionsA[0].score)
                      .map(([category, options]) => {
                        const includeOption = options[0];
                        const isChecked = selectedOptions[category] === 0;

                        return (
                          <div key={category} className="flex items-center bg-white rounded px-4 py-2.5 border border-blue-300">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                setSelectedOptions(prev => ({
                                  ...prev,
                                  [category]: e.target.checked ? 0 : 1
                                }));
                              }}
                              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer mr-3"
                            />
                            <span className="text-sm font-semibold text-gray-800 flex-shrink-0 w-[140px]">
                              {category.replace(/_/g, " ")}
                            </span>
                            <span className={`text-base font-bold flex-shrink-0 w-[80px] text-center ${
                              isChecked
                                ? (includeOption.score >= 0 ? 'text-blue-600' : 'text-red-600')
                                : 'text-gray-400'
                            }`}>
                              {includeOption.score >= 0 ? '+' : ''}{includeOption.score} pts
                            </span>
                            <span className="text-sm text-gray-600 flex-1 ml-4">
                              {includeOption.reason}
                            </span>
                          </div>
                        );
                      })}
                  </div>

                  {/* Right side: Total Points */}
                  <div className="flex-[4] flex flex-col items-center justify-start">
                    <div className="text-center bg-white rounded-lg p-6 shadow-md w-full">
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Points</h3>
                      <div className="text-5xl font-bold mb-4">
                        <span className="text-blue-600">{calculateTotalPoints().toFixed(2)}</span>
                      </div>
                      {roleRP !== undefined && (
                        <div className={`text-sm font-semibold ${
                          calculateTotalPoints() >= roleRP ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {calculateTotalPoints() >= roleRP ? '✓ Beats your BATNA!' : '✗ Below your BATNA'}
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex flex-col gap-2 w-full">
                      <button
                        onClick={handleSubmitProposal}
                        disabled={!displayData.canSubmitProposal && !displayData.submitBlockedMessage}
                        className={`px-4 py-2 rounded font-semibold transition-colors text-sm ${
                          displayData.submitBlockedMessage
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : !displayData.canSubmitProposal
                            ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                            : !hasSubmittedOnce
                            ? "bg-green-600 text-white hover:bg-green-700 animate-pulse-button"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        {!displayData.canSubmitProposal && !displayData.submitBlockedMessage
                          ? "Proposal Pending"
                          : "Submit Proposal"}
                      </button>
                      {showEmptyProposalError && (
                        <div className="text-red-600 text-sm font-semibold text-center p-2 bg-red-50 rounded">
                          Please select some options for your proposal
                        </div>
                      )}
                      <button
                        onClick={() => setSelectedOptions({})}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm font-medium"
                      >
                        Reset All
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "proposal" && (
            <div className="space-y-4">
              {/* Current Proposal to vote on */}
              {displayData.currentProposal ? (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Current Proposal</h3>
                    {displayData.currentProposal.isUserProposal ? (
                      <span className="px-4 py-2 bg-blue-100 text-blue-700 font-bold text-lg rounded">
                        YOUR PROPOSAL
                      </span>
                    ) : (
                      <span className="px-4 py-2 bg-amber-100 text-amber-700 font-bold text-lg rounded">
                        SUBMITTED BY: {displayData.currentProposal.submittedByName}
                      </span>
                    )}
                  </div>

                  {/* Points display */}
                  <div className="mb-6">
                    <div className="text-center mb-4">
                      <p className="text-sm text-gray-600 mb-1">Value to you:</p>
                      <p className="text-4xl font-bold text-blue-600">
                        {calculateProposalPoints(displayData.currentProposal.options).toFixed(2)} points
                      </p>
                      {roleRP !== undefined && (
                        <p className={`text-sm font-semibold mt-1 ${
                          calculateProposalPoints(displayData.currentProposal.options) >= roleRP
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {calculateProposalPoints(displayData.currentProposal.options) >= roleRP
                            ? '✓ Beats your BATNA'
                            : '✗ Below your BATNA'}
                        </p>
                      )}
                    </div>

                    {/* Proposal details */}
                    <div className="bg-blue-50 rounded p-4 mb-4">
                      <h4 className="text-sm font-bold text-gray-700 mb-2">Proposal Details:</h4>
                      <div className="space-y-1">
                        {Object.entries(roleScoresheet).map(([category]) => {
                          const optionIdx = displayData.currentProposal.options[category] ?? 1;
                          const isIncluded = optionIdx === 0;
                          return (
                            <div key={category} className="flex items-center text-sm">
                              <span className={`w-4 h-4 mr-2 rounded ${isIncluded ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                              <span className="text-gray-700">{category.replace(/_/g, " ")}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Vote buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => onVote(displayData.currentProposal.id, "accept")}
                        className="flex-1 px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-semibold"
                      >
                        ✓ Accept
                      </button>
                      <button
                        onClick={() => onVote(displayData.currentProposal.id, "reject")}
                        className="flex-1 px-4 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-semibold"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                  <p className="text-gray-500">No pending proposal. Submit a proposal from the Scoring tab.</p>
                </div>
              )}

              {/* Proposal History */}
              {displayData.proposals.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Proposal History</h3>
                  <div className="space-y-3">
                    {[...displayData.proposals].reverse().map((proposal) => {
                      const proposalPoints = calculateProposalPoints(proposal.options);
                      const { accepts } = countVotes(proposal.initialVotes);
                      const acceptancePercentage = (accepts / playerCount) * 100;

                      let voteColor;
                      if (acceptancePercentage === 0) voteColor = "text-red-400 opacity-95";
                      else if (acceptancePercentage < 50) voteColor = "text-orange-500 opacity-95";
                      else if (acceptancePercentage === 50) voteColor = "text-yellow-600";
                      else if (acceptancePercentage < 100) voteColor = "text-lime-600";
                      else voteColor = "text-green-600";

                      return (
                        <div key={proposal.id} className="bg-gray-50 rounded p-4 border border-gray-200">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            {/* Proposal items list */}
                            <div className="flex-1">
                              <h5 className="text-xs font-bold text-gray-600 uppercase mb-2">Proposal Items:</h5>
                              <div className="space-y-1">
                                {Object.entries(roleScoresheet).map(([category]) => {
                                  const optionIdx = proposal.options[category] ?? 1;
                                  const isIncluded = optionIdx === 0;
                                  return (
                                    <div key={category} className="flex items-center text-xs">
                                      <span className={`w-3 h-3 mr-2 rounded ${isIncluded ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                      <span className="text-gray-700">{category.replace(/_/g, " ")}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Right column: Badge + Vote count */}
                            <div className="flex flex-col items-end gap-3">
                              {proposal.isUserProposal ? (
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 font-bold text-sm rounded">
                                  YOUR PROPOSAL
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-amber-100 text-amber-700 font-bold text-sm rounded">
                                  SUBMITTED BY: {proposal.submittedByName}
                                </span>
                              )}

                              <div className="text-center bg-white rounded p-3 border border-gray-300 min-w-[120px]">
                                <p className={`text-3xl font-bold ${voteColor} mb-1`}>
                                  {accepts}/{playerCount}
                                </p>
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Accepted</p>
                                <p className="text-lg font-bold text-gray-700">
                                  {proposalPoints.toFixed(2)} pts
                                </p>
                              </div>
                            </div>
                          </div>
                          <button
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                            onClick={() => handleModifyProposal(proposal.options)}
                          >
                            Modify
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "tips" && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Tips on Negotiation</h3>
                <div className="prose prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: tips }} />
              </div>
            </div>
          )}
        </div>

        {/* Finalize Modal */}
        {displayData.showFinalize && displayData.acceptedProposal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
              <div className="text-center mb-6">
                <h3 className="text-3xl font-bold text-green-700 mb-3">
                  Congratulations!
                </h3>
                <p className="text-lg text-gray-700 mb-2">
                  Everyone has accepted this proposal.
                </p>
                <p className="text-md text-gray-600">
                  Would you like to finalize this deal, or keep discussing?
                </p>
              </div>

              <div className="text-center mb-6 p-4 bg-green-50 rounded">
                <p className="text-sm text-gray-600 mb-1">Your score with this proposal:</p>
                <p className="text-4xl font-bold text-green-600">
                  {calculateProposalPoints(displayData.acceptedProposal.options).toFixed(2)} points
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => onFinalizeVote("finalize")}
                  className="w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold text-lg"
                >
                  Finalize Deal
                </button>
                <button
                  onClick={() => onFinalizeVote("continue")}
                  className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold text-lg"
                >
                  Keep Discussing
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Blocked Submission Modal */}
        {showBlockedModal && displayData.submitBlockedMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-2xl p-8 max-w-lg w-full mx-4">
              <div className="text-6xl mb-4 text-center">⚠️</div>
              <h2 className="text-2xl font-bold mb-4 text-center">Not Yet</h2>
              <p className="text-lg text-gray-700 mb-6 text-center">{displayData.submitBlockedMessage}</p>
              <button
                onClick={() => setShowBlockedModal(false)}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 font-bold text-xl"
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
