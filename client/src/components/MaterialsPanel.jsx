import React, { useState } from "react";
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

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Scroll to top of page
    window.scrollTo(0, 0);
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

  // Handle modifying a rejected proposal
  const handleModifyProposal = (proposalOptions) => {
    // Set the calculator checkboxes to match the proposal
    setSelectedOptions(proposalOptions);

    // Switch to calculator tab
    handleTabChange("calculator");
  };

  // Get proposals for display
  const proposals = stage.get("proposals") || [];
  const pendingProposal = proposals.find(p => p.status === "pending");
  const rejectedProposals = proposals.filter(p => p.status === "rejected");

  return (
    <div className="w-full bg-gray-300 p-6 flex flex-col relative min-h-screen">
      {/* Bottom fade overlay */}
      <div className="fixed left-0 bottom-0 w-[70%] h-12 bg-gradient-to-t from-gray-300 to-transparent pointer-events-none z-10"></div>

      {/* Tab Navigation - cleaner style with all-around borders */}
      <div className="flex gap-2 mb-2">
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
          Scoring
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

      {/* Tab Content */}
      <div className="flex-1">
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
                <span className="w-8"></span> {/* Checkbox space */}
                <span className="text-xs font-bold text-gray-700 uppercase flex-shrink-0 w-[140px]">
                  Feature
                </span>
                <span className="text-xs font-bold text-gray-700 uppercase flex-shrink-0 w-[80px] text-center">
                  Points
                </span>
                <span className="text-xs font-bold text-gray-700 uppercase flex-1 ml-4">
                  Reason
                </span>
              </div>

              {/* Main content area with rows and total points side by side */}
              <div className="flex gap-6">
                {/* Left side: Scoresheet rows (2/3 width) */}
                <div className="flex-[2] space-y-2">
                  {Object.entries(roleScoresheet).map(([category, options]) => {
                    const includeOption = options[0];
                    const isChecked = selectedOptions[category] === 0;

                    return (
                      <div key={category} className="flex items-center bg-white rounded px-4 py-2.5 border border-blue-300">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            setSelectedOptions(prev => {
                              if (e.target.checked) {
                                return { ...prev, [category]: 0 };
                              } else {
                                return { ...prev, [category]: 1 };
                              }
                            });
                          }}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer mr-3"
                        />
                        <span className="text-sm font-semibold text-gray-800 flex-shrink-0 w-[140px]">
                          {category.replace(/_/g, " ")}
                        </span>
                        <span className={`text-base font-bold flex-shrink-0 w-[80px] text-center ${isChecked ? 'text-blue-600' : 'text-gray-400'}`}>
                          {isChecked ? `${includeOption.score >= 0 ? '+' : ''}${includeOption.score}` : '0'} pts
                        </span>
                        <span className="text-sm text-gray-600 flex-1 ml-4">
                          {includeOption.reason}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Right side: Total Points (1/3 width) */}
                <div className="flex-[1] flex flex-col items-center justify-start">
                  <div className="text-center bg-white rounded-lg p-6 shadow-md w-full">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Points</h3>
                    <div className="text-5xl font-bold mb-4">
                      <span className="text-blue-600">
                        {calculateTotalPoints().toFixed(2)}
                      </span>
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

                    // Calculate acceptance percentage for color coding
                    const acceptancePercentage = (yesVotes / playerCount) * 100;

                    // Determine color based on percentage: red (0%) -> yellow (50%) -> green (100%)
                    let voteColor;
                    if (acceptancePercentage === 0) {
                      voteColor = "text-red-400 opacity-95";
                    } else if (acceptancePercentage < 50) {
                      voteColor = "text-orange-500 opacity-95";
                    } else if (acceptancePercentage === 50) {
                      voteColor = "text-yellow-600";
                    } else if (acceptancePercentage < 100) {
                      voteColor = "text-lime-600";
                    } else {
                      voteColor = "text-green-600";
                    }

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
                            <p className={`text-3xl font-bold ${voteColor} mb-1`}>
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
      </div>
    </div>
  );
}
