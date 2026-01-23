import React, { useState, useEffect } from "react";
import Markdown from "react-markdown";
import { usePlayer } from "@empirica/core/player/classic/react";

export function DemoMaterialsPanel({
  roleName,
  roleNarrative,
  roleScoresheet,
  roleBATNA,
  roleRP,
  tips,
  onProposalSubmit,
  onVote,
  onFinalizeVote
}) {
  const player = usePlayer();
  const playerCount = 3; // Hardcoded for demo
  const [activeTab, setActiveTab] = useState("calculator");
  const [selectedOptions, setSelectedOptions] = useState({});
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [flashProposalTab, setFlashProposalTab] = useState(false);
  const [showEmptyProposalError, setShowEmptyProposalError] = useState(false);
  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(() => {
    return player.get("intro_hasSubmittedOnce") || false;
  });

  // Get proposal history from player state (intro_ prefix)
  const history = player.get("intro_proposalHistory") || [];
  const currentProposal = history.length > 0 ? history[history.length - 1] : null;

  // Compute proposal state from vote counts (derived state, no useEffect needed)
  let proposalState = "none"; // "none" | "collecting-initial" | "collecting-final" | "complete"

  if (currentProposal) {
    const initialVoteCount = Object.keys(currentProposal.initialVotes).length;

    if (initialVoteCount < playerCount) {
      proposalState = "collecting-initial";
    } else {
      const rejectCount = Object.values(currentProposal.initialVotes).filter(v => v === "reject").length;

      if (rejectCount >= 1) {
        proposalState = "complete"; // Failed at initial stage
      } else {
        // All accepted, check final votes
        const finalVoteCount = Object.keys(currentProposal.finalVotes).length;

        if (finalVoteCount < playerCount) {
          proposalState = "collecting-final";
        } else {
          proposalState = "complete"; // Either finalized or failed at ratification
        }
      }
    }
  }

  // Determine what to show
  const pendingProposal = proposalState === "collecting-initial" ? currentProposal : null;

  // Determine if we should show the finalize modal (persist even after voting completes)
  let acceptedPendingProposal = null;
  if (currentProposal) {
    const allInitialAccept = Object.keys(currentProposal.initialVotes).length === playerCount &&
                            Object.values(currentProposal.initialVotes).every(v => v === "accept");

    if (allInitialAccept) {
      const finalVoteCount = Object.keys(currentProposal.finalVotes).length;
      const allFinalize = finalVoteCount === playerCount &&
                         Object.values(currentProposal.finalVotes).every(v => v === "finalize");
      const hasPlayerDismissed = currentProposal.modalDismissed?.[player.id];

      // Show modal if:
      // - Still collecting final votes, OR
      // - Voting complete but not unanimous finalize AND player hasn't dismissed
      if (finalVoteCount < playerCount || (!allFinalize && !hasPlayerDismissed)) {
        acceptedPendingProposal = currentProposal;
      }
    }
  }

  const allHistoryProposals = proposalState === "none" || proposalState === "complete" ? history : history.slice(0, -1);

  // Auto-show finalize modal when acceptedPendingProposal exists and player hasn't voted
  useEffect(() => {
    if (acceptedPendingProposal && !acceptedPendingProposal.finalVotes[player.id] && !showFinalizeModal) {
      setShowFinalizeModal(true);
    }
  }, [acceptedPendingProposal?.id, player.id, showFinalizeModal]);

  // Flash the Proposal tab when there's a pending proposal
  useEffect(() => {
    if (pendingProposal && activeTab !== "proposal") {
      const interval = setInterval(() => {
        setFlashProposalTab(prev => !prev);
      }, 1000); // Flash every second

      return () => clearInterval(interval);
    } else {
      setFlashProposalTab(false);
    }
  }, [pendingProposal, activeTab]);

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
    // Stop wiggle on any click
    setHasSubmittedOnce(true);
    player.set("intro_hasSubmittedOnce", true);

    // Check if at least one option is selected (at least one category has option 0)
    const hasAnySelection = Object.values(selectedOptions).some(val => val === 0);

    if (!hasAnySelection) {
      setShowEmptyProposalError(true);
      setTimeout(() => setShowEmptyProposalError(false), 3000); // Hide after 3 seconds
      return;
    }

    const newProposal = {
      id: `${Date.now()}-${player.id}`,
      submittedBy: player.id,
      submittedByName: player.get("intro_displayName") || player.get("displayName") || player.id,
      timestamp: Date.now(),
      options: { ...selectedOptions },
      initialVotes: {},
      finalVotes: {},
      modalDismissed: {}
    };
    player.set("intro_proposalHistory", [...history, newProposal]);

    // Notify parent component
    if (onProposalSubmit) {
      onProposalSubmit(newProposal);
    }

    // Switch to Proposal tab
    handleTabChange("proposal");
  };

  // Handle vote on proposal (initial votes)
  const handleVote = (proposalId, vote) => {
    console.log("DemoMaterialsPanel handleVote called:", { proposalId, vote });
    const updatedHistory = [...history];
    const proposal = updatedHistory.find(p => p.id === proposalId);
    console.log("proposal found:", !!proposal);

    if (!proposal) return;

    // Notify parent component - let parent decide whether to record the vote
    if (onVote) {
      console.log("Calling onVote callback");
      onVote(proposalId, vote);
      console.log("onVote callback returned");
    }
  };

  // Handle modifying a rejected proposal
  const handleModifyProposal = (proposalOptions) => {
    // Set the calculator checkboxes to match the proposal
    setSelectedOptions(proposalOptions);

    // Switch to calculator tab
    handleTabChange("calculator");
  };

  // Handle finalize decision (finalize or continue)
  const handleFinalizeVote = (proposalId, decision) => {
    const updatedHistory = [...history];
    const proposal = updatedHistory.find(p => p.id === proposalId);

    if (!proposal) return;

    // Notify parent component - let parent decide whether to record the vote
    if (onFinalizeVote) {
      onFinalizeVote(proposalId, decision);
    }
  };

  // Handle dismissing the finalize modal
  const handleDismissModal = (proposalId) => {
    const updatedHistory = [...history];
    const proposal = updatedHistory.find(p => p.id === proposalId);

    if (!proposal) return;

    if (!proposal.modalDismissed) {
      proposal.modalDismissed = {};
    }
    proposal.modalDismissed[player.id] = true;

    player.set("intro_proposalHistory", updatedHistory);
    setShowFinalizeModal(false);
  };

  return (
    <>
      <style>{`
        @keyframes wiggle {
          0%, 90%, 100% {
            transform: rotate(0deg);
            filter: brightness(1);
          }
          92% {
            transform: rotate(-0.5deg);
            filter: brightness(1.15);
          }
          94% {
            transform: rotate(0.5deg);
            filter: brightness(1.2);
          }
          96% {
            transform: rotate(-0.5deg);
            filter: brightness(1.15);
          }
          98% {
            transform: rotate(0.5deg);
            filter: brightness(1.1);
          }
        }
        .animate-wiggle {
          animation: wiggle 2s ease-in-out infinite;
        }
      `}</style>
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
              : pendingProposal && flashProposalTab
              ? "bg-red-100 text-red-700 border-red-400 shadow-md"
              : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
          }`}
        >
          Proposal
          {pendingProposal && (
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
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Your Role
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

                {/* Right side: Total Points (1/3 width) */}
                <div className="flex-[4] flex flex-col items-center justify-start">
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
                      disabled={pendingProposal !== null}
                      className={`px-4 py-2 rounded font-semibold transition-colors text-sm ${
                        pendingProposal !== null
                          ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                          : !hasSubmittedOnce
                          ? "bg-green-600 text-white hover:bg-green-700 animate-wiggle"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      {pendingProposal !== null ? "Proposal Pending" : "Submit Proposal"}
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
            {/* Pending Proposal */}
            {pendingProposal ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    Current Proposal
                  </h3>
                  {pendingProposal.submittedBy === player.id ? (
                    <span className="px-4 py-2 bg-blue-100 text-blue-700 font-bold text-lg rounded">
                      YOUR PROPOSAL
                    </span>
                  ) : (
                    <span className="px-4 py-2 bg-amber-100 text-amber-700 font-bold text-lg rounded">
                      SUBMITTED BY: {pendingProposal.submittedByName}
                    </span>
                  )}
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
                      {pendingProposal.initialVotes[player.id] ? (
                        <div className="text-center p-4 bg-gray-100 rounded">
                          <p className="text-sm text-gray-600">
                            You voted: <span className="font-bold">
                              {pendingProposal.initialVotes[player.id] === "accept" ? "✓ Accept" : "✗ Reject"}
                            </span>
                          </p>
                          <p className="text-base font-semibold text-gray-700 mt-2">
                            Waiting for other players... ({Object.keys(pendingProposal.initialVotes).length}/{playerCount} voted)
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
                <p className="text-gray-500">No pending proposal. Submit a proposal from the Scoring tab.</p>
              </div>
            )}

            {/* Proposal History (Rejected + Accepted Pending) */}
            {allHistoryProposals.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Proposal History
                </h3>
                <div className="space-y-3">
                  {[...allHistoryProposals].reverse().map((proposal) => {
                    // Calculate points for this player
                    const proposalPoints = Object.entries(roleScoresheet).reduce((sum, [category]) => {
                      const optionIdx = proposal.options[category] ?? 1;
                      return sum + (roleScoresheet[category]?.[optionIdx]?.score || 0);
                    }, 0);

                    // Count yes votes (from initial votes)
                    const yesVotes = Object.values(proposal.initialVotes).filter(v => v === "accept").length;

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

                          {/* Right column: Submitter badge + Vote count and points */}
                          <div className="flex flex-col items-end gap-3">
                            {/* Submitter badge */}
                            {proposal.submittedBy === player.id ? (
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 font-bold text-sm rounded">
                                YOUR PROPOSAL
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-amber-100 text-amber-700 font-bold text-sm rounded">
                                SUBMITTED BY: {proposal.submittedByName}
                              </span>
                            )}

                            {/* Vote count and points */}
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
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Tips on Negotiation
              </h3>
              <div className="prose prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: tips }} />
            </div>
          </div>
        )}
      </div>

      {/* Finalize Modal - Popup */}
      {showFinalizeModal && acceptedPendingProposal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
            {/* Calculate points for this player */}
            {(() => {
              const proposalPoints = Object.entries(roleScoresheet).reduce((sum, [category]) => {
                const optionIdx = acceptedPendingProposal.options[category] ?? 1;
                return sum + (roleScoresheet[category]?.[optionIdx]?.score || 0);
              }, 0);

              const finalVoteCount = Object.keys(acceptedPendingProposal.finalVotes).length;
              const hasVoted = !!acceptedPendingProposal.finalVotes?.[player.id];
              const allVoted = finalVoteCount === playerCount;
              const allFinalize = allVoted && Object.values(acceptedPendingProposal.finalVotes).every(v => v === "finalize");

              // If player has voted, show waiting screen
              if (hasVoted) {
                return (
                  <div>
                    <div className="text-center mb-6">
                      <div className="text-6xl mb-4">⏳</div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        Waiting for other votes...
                      </h3>
                      <p className="text-lg text-gray-600 mb-4">
                        {allVoted && !allFinalize ? (
                          <span>Outcome: <span className="font-bold text-blue-700">Continue</span></span>
                        ) : (
                          <span>You voted: <span className="font-bold text-green-700">
                            {acceptedPendingProposal.finalVotes[player.id] === "finalize" ? "Finalize" : "Continue"}
                          </span></span>
                        )}
                      </p>
                      <div className="text-center p-4 bg-gray-100 rounded">
                        <p className="text-4xl font-bold text-blue-600 mb-2">
                          {finalVoteCount}/{playerCount}
                        </p>
                        <p className="text-sm text-gray-600">
                          players have voted
                        </p>
                      </div>
                    </div>

                    {/* Show close button if voting is complete but not unanimous */}
                    {allVoted && !allFinalize && (
                      <button
                        onClick={() => handleDismissModal(acceptedPendingProposal.id)}
                        className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                      >
                        Close
                      </button>
                    )}
                  </div>
                );
              }

              // If player hasn't voted, show decision screen
              return (
                <div>
                  <div className="text-center mb-6">
                    <h3 className="text-3xl font-bold text-green-700 mb-3">
                      🎉 Congratulations!
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
                      {proposalPoints.toFixed(2)} points
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => {
                        handleFinalizeVote(acceptedPendingProposal.id, "finalize");
                      }}
                      className="w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold text-lg"
                    >
                      Finalize Deal
                    </button>
                    <button
                      onClick={() => {
                        handleFinalizeVote(acceptedPendingProposal.id, "continue");
                      }}
                      className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold text-lg"
                    >
                      Keep Discussing
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
      </div>
    </>
  );
}
