import React, { useState, useRef } from "react";
import Markdown from "react-markdown";
import { usePlayer, useStage, useGame } from "@empirica/core/player/classic/react";

export function MaterialsPanel({
  roleName,
  roleNarrative,
  roleScoresheet,
  roleBATNA,
  roleRP
}) {
  const player = usePlayer();
  const stage = useStage();
  const game = useGame();
  const { playerCount } = game.get("treatment");
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

  // Calculate current total points
  const calculateTotalPoints = () => {
    return Object.entries(roleScoresheet).reduce((sum, [category]) => {
      const optionIdx = selectedOptions[category] ?? 1; // Default to exclude (index 1)
      return sum + (roleScoresheet[category]?.[optionIdx]?.score || 0);
    }, 0);
  };

  // Handle proposal submission
  const handleSubmitProposal = () => {
    const totalPoints = calculateTotalPoints();
    const proposalId = `${Date.now()}-${player.id}`;

    // Get current proposals or initialize empty array
    const currentProposals = stage.get("proposals") || [];

    // Create new proposal
    const newProposal = {
      id: proposalId,
      submittedBy: player.id,
      submittedByName: player.get("name") || player.id,
      timestamp: Date.now(),
      options: { ...selectedOptions },
      votes: {}, // Will store playerId: "accept" | "reject"
      status: "pending" // "pending" | "accepted" | "rejected"
    };

    // Add to proposals array
    stage.set("proposals", [...currentProposals, newProposal]);

    // Switch to Proposal tab
    handleTabChange("proposal");
  };

  // Handle vote on proposal
  const handleVote = (proposalId, vote) => {
    const currentProposals = stage.get("proposals") || [];
    const proposalIndex = currentProposals.findIndex(p => p.id === proposalId);

    if (proposalIndex === -1) return;

    const updatedProposals = [...currentProposals];
    const proposal = { ...updatedProposals[proposalIndex] };

    // Update vote
    proposal.votes = {
      ...proposal.votes,
      [player.id]: vote
    };

    // Check if all players have voted
    const voteCount = Object.keys(proposal.votes).length;
    const allVoted = voteCount === playerCount;

    if (allVoted) {
      // Check if all votes are "accept"
      const allAccepted = Object.values(proposal.votes).every(v => v === "accept");

      if (allAccepted) {
        proposal.status = "accepted";
        updatedProposals[proposalIndex] = proposal;
        stage.set("proposals", updatedProposals);

        // End the stage for this player
        player.stage.set("submit", true);
      } else {
        // At least one rejection
        proposal.status = "rejected";
        updatedProposals[proposalIndex] = proposal;
        stage.set("proposals", updatedProposals);
      }
    } else {
      // Still waiting for votes
      updatedProposals[proposalIndex] = proposal;
      stage.set("proposals", updatedProposals);
    }
  };

  // Get proposals for display
  const proposals = stage.get("proposals") || [];
  const pendingProposal = proposals.find(p => p.status === "pending");
  const rejectedProposals = proposals.filter(p => p.status === "rejected");

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
        <button
          onClick={() => handleTabChange("proposal")}
          className={`px-4 py-2 rounded font-medium transition-all border ${
            activeTab === "proposal"
              ? "bg-white text-blue-600 border-blue-400 shadow"
              : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
          }`}
        >
          Proposal
          {pendingProposal && (
            <span className="ml-2 inline-flex items-center justify-center w-2 h-2 bg-red-500 rounded-full"></span>
          )}
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
                <div className="mt-6 flex flex-col gap-2">
                  <button
                    onClick={handleSubmitProposal}
                    disabled={pendingProposal !== undefined}
                    className={`px-4 py-2 rounded font-semibold transition-colors text-sm ${
                      pendingProposal
                        ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    {pendingProposal ? "Proposal Pending" : "Submit Proposal"}
                  </button>
                  <button
                    onClick={() => setSelectedOptions({})}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    Reset All
                  </button>
                </div>
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

        {activeTab === "proposal" && (
          <div className="space-y-4">
            {/* Pending Proposal */}
            {pendingProposal ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    Current Proposal
                  </h3>
                  <span className="text-sm text-gray-500">
                    by {pendingProposal.submittedByName}
                  </span>
                </div>

                {/* Calculate points for this player */}
                {(() => {
                  const proposalPoints = Object.entries(roleScoresheet).reduce((sum, [category]) => {
                    const optionIdx = pendingProposal.options[category] ?? 1;
                    return sum + (roleScoresheet[category]?.[optionIdx]?.score || 0);
                  }, 0);

                  return (
                    <div className="mb-6">
                      <div className="text-center mb-4">
                        <p className="text-sm text-gray-600 mb-1">Value to you:</p>
                        <p className="text-4xl font-bold text-blue-600">
                          {proposalPoints.toFixed(2)} points
                        </p>
                        {roleRP !== undefined && (
                          <p className={`text-sm font-semibold mt-1 ${
                            proposalPoints >= roleRP ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {proposalPoints >= roleRP ? '✓ Beats your BATNA' : '✗ Below your BATNA'}
                          </p>
                        )}
                      </div>

                      {/* Show proposal details */}
                      <div className="bg-blue-50 rounded p-4 mb-4">
                        <h4 className="text-sm font-bold text-gray-700 mb-2">Proposal Details:</h4>
                        <div className="space-y-1">
                          {Object.entries(roleScoresheet).map(([category]) => {
                            const optionIdx = pendingProposal.options[category] ?? 1;
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

                      {/* Vote buttons or status */}
                      {pendingProposal.votes[player.id] ? (
                        <div className="text-center p-4 bg-gray-100 rounded">
                          <p className="text-sm text-gray-600">
                            You voted: <span className="font-bold">
                              {pendingProposal.votes[player.id] === "accept" ? "✓ Accept" : "✗ Reject"}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Waiting for other players... ({Object.keys(pendingProposal.votes).length}/{playerCount} voted)
                          </p>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleVote(pendingProposal.id, "accept")}
                            className="flex-1 px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-semibold"
                          >
                            ✓ Accept
                          </button>
                          <button
                            onClick={() => handleVote(pendingProposal.id, "reject")}
                            className="flex-1 px-4 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-semibold"
                          >
                            ✗ Reject
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-500">No pending proposal. Submit a proposal from the Calculator tab.</p>
              </div>
            )}

            {/* Rejected Proposals History */}
            {rejectedProposals.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Rejected Proposals
                </h3>
                <div className="space-y-3">
                  {rejectedProposals.map((proposal) => {
                    // Calculate points for this player
                    const proposalPoints = Object.entries(roleScoresheet).reduce((sum, [category]) => {
                      const optionIdx = proposal.options[category] ?? 1;
                      return sum + (roleScoresheet[category]?.[optionIdx]?.score || 0);
                    }, 0);

                    // Count yes votes
                    const yesVotes = Object.values(proposal.votes).filter(v => v === "accept").length;

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

                          {/* Vote count and points - more prominent */}
                          <div className="text-center bg-white rounded p-3 border border-gray-300 min-w-[120px]">
                            <p className="text-3xl font-bold text-red-600 mb-1">
                              {yesVotes}/{playerCount}
                            </p>
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                              Accepted
                            </p>
                            <p className="text-lg font-bold text-gray-700">
                              {proposalPoints.toFixed(2)} pts
                            </p>
                          </div>
                        </div>
                        <button
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                          onClick={() => {
                            // TODO: Implement modify functionality
                            alert("Modify functionality will be implemented later");
                          }}
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
      </div>
    </div>
  );
}
