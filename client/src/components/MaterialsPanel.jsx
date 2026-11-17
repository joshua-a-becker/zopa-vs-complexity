import React, { useState, useEffect, useRef } from "react";
import { RoleNotesCard } from "./RoleNotesCard";
import { CheckboxCalculator, ProposalItems, pointsOf as scoresheetPoints, voteColor as voteColorFor } from "./CheckboxCalculator";
import { usePlayer, useStage, useRound, useGame } from "@empirica/core/player/classic/react";

const QUIT_COUNTDOWN_SECONDS = 15;
// Extra time non-initiators wait past zero before force-ending the game themselves,
// covering clock skew between clients and an initiator who disconnected mid-countdown.
const QUIT_GRACE_SECONDS = 5;

export function MaterialsPanel({
  roleName,
  roleNarrative,
  roleScoresheet,
  roleBATNA,
  roleRP
}) {
  const player = usePlayer();
  const stage = useStage();
  const round = useRound();
  const game = useGame();
  const { playerCount } = game.get("treatment");
  const tips = game.get("tips") || "";
  const [selectedOptions, setSelectedOptions] = useState({});
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [showNegativePointsModal, setShowNegativePointsModal] = useState(false);
  const [showBlankProposalModal, setShowBlankProposalModal] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showQuitConfirmModal, setShowQuitConfirmModal] = useState(false);
  const [quitSecondsLeft, setQuitSecondsLeft] = useState(QUIT_COUNTDOWN_SECONDS);

  // Check if welcome modal has been shown before (stored in player state)
  const hasSeenWelcomeModal = player.get("hasSeenWelcomeModal") || false;
  const [showWelcomeModal, setShowWelcomeModal] = useState(!hasSeenWelcomeModal);
  const proposalsColumnRef = useRef(null);
  const [wiggleStoppedId, setWiggleStoppedId] = useState(null); // proposal id whose wiggle the user interrupted

  // Get proposal history from round state (single source of truth)
  const history = round.get("proposalHistory") || [];
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

  // Check if everyone voted to finalize and submit for this player
  useEffect(() => {
    if (currentProposal) {
      const finalVoteCount = Object.keys(currentProposal.finalVotes).length;
      if (finalVoteCount === playerCount) {
        const allFinalize = Object.values(currentProposal.finalVotes).every(v => v === "finalize");
        if (allFinalize) {
          player.stage.set("submit", true);
        }
      }
    }
  }, [currentProposal?.finalVotes, playerCount, player]);

  // Quit countdown: driven by shared game state so every participant sees it.
  // Each client counts down locally from quitRequest.startedAt — no per-second server writes.
  const quitRequest = game.get("quitRequest");
  useEffect(() => {
    if (!quitRequest) {
      setQuitSecondsLeft(QUIT_COUNTDOWN_SECONDS);
      return;
    }

    const tick = () => {
      const elapsed = (Date.now() - quitRequest.startedAt) / 1000;
      const remaining = Math.max(0, QUIT_COUNTDOWN_SECONDS - Math.floor(elapsed));
      setQuitSecondsLeft(remaining);

      if (game.get("forceQuit")) return;

      const isInitiator = quitRequest.by === player.id;
      const deadline = isInitiator
        ? QUIT_COUNTDOWN_SECONDS
        : QUIT_COUNTDOWN_SECONDS + QUIT_GRACE_SECONDS;

      if (elapsed >= deadline) {
        game.set("forceQuitBy", quitRequest.by);
        game.set("forceQuit", true);
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [quitRequest?.startedAt, quitRequest?.by, player.id]);


  // Handle proposal submission
  const handleSubmitProposal = () => {
    // Check if at least one item is selected (at least one category has option 0)
    const hasAtLeastOneItem = Object.values(selectedOptions).some(optionIdx => optionIdx === 0);

    if (!hasAtLeastOneItem) {
      setShowBlankProposalModal(true);
      return;
    }

    // Submitting counts as your Accept vote, so the same rule applies: you
    // can't put forward a deal worth negative points to you.
    if (pointsOf(selectedOptions) < 0) {
      setShowNegativePointsModal("submit");
      return;
    }

    const now = Date.now();
    const newProposal = {
      id: `${now}-${player.id}`,
      submittedBy: player.id,
      submittedByName: player.get("displayName") || player.id,
      timestamp: now,
      options: { ...selectedOptions },
      // Submitting counts as the proposer's Accept vote: people never vote on
      // their own proposal (as in creative-negotiation / workshop-app).
      initialVotes: { [player.id]: "accept" },
      finalVotes: {},
      modalDismissed: {}
    };
    round.set("proposalHistory", [...history, newProposal]);

    const existing = player.get("heartbeat") || [];
    player.set("heartbeat", [...existing, ["proposal", now, newProposal.id]]);
  };

  // Handle vote on proposal (initial votes)
  const handleVote = (proposalId, vote) => {
    // If voting "accept", check if proposal has negative points for this player
    if (vote === "accept") {
      const proposal = history.find(p => p.id === proposalId);

      if (proposal) {
        const proposalPoints = Object.entries(roleScoresheet).reduce((sum, [category]) => {
          const optionIdx = proposal.options[category] ?? 1;
          return sum + (roleScoresheet[category]?.[optionIdx]?.score || 0);
        }, 0);

        if (proposalPoints < 0) {
          setShowNegativePointsModal(true);
          return;
        }
      }
    }

    const updatedHistory = [...history];
    const proposal = updatedHistory.find(p => p.id === proposalId);

    if (!proposal) return;

    // Update initial vote
    proposal.initialVotes[player.id] = vote;
    round.set("proposalHistory", updatedHistory);
  };

  // Handle modifying a rejected proposal
  const handleModifyProposal = (proposalOptions) => {
    // Set the calculator checkboxes to match the proposal
    setSelectedOptions(proposalOptions);

    // The calculator sits near the top of the proposals column.
    proposalsColumnRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Handle finalize decision (finalize or continue)
  const handleFinalizeVote = (proposalId, decision) => {
    const updatedHistory = [...history];
    const proposal = updatedHistory.find(p => p.id === proposalId);

    if (!proposal) return;

    // Update final vote
    proposal.finalVotes[player.id] = decision;

    round.set("proposalHistory", updatedHistory);
    // useEffect will handle stage submission if everyone votes to finalize
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

    round.set("proposalHistory", updatedHistory);
    setShowFinalizeModal(false);
  };

  // Instructions content (no counterpart in creative-negotiation; kept as a tab
  // in the left card).
  const instructions = (
    <div>
      <ul className="list-disc list-outside pl-5 space-y-2 mt-2 text-gray-700">
        <li><strong>What determines how much I earn?</strong> Points earned from any agreement become your bonus on Prolific (1 point = £1.00). No agreement means no bonus.</li>
        <li><strong>How can we reach an agreement?</strong> All three people must accept the same final proposal, which must be submitted officially in the system. A verbal agreement is not enough! You may need to submit and vote on multiple proposals to reach agreement.</li>
        <li><strong>What happens if we don't reach an agreement?</strong> If your group does not reach an agreement, everyone will keep working from home. This outcome is worth 0 points. (No bonus.)</li>
        <li><strong>What if my group is incomplete?</strong> If someone quits or stops responding, you may end the game early by clicking the 'quit' button.</li>
        <li><strong>How should I prepare?</strong> Get into character! Think about how you would introduce yourself, what you want, and how you might advocate for your best outcome.</li>
      </ul>
      {tips && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Tips on Negotiation
          </h3>
          <div className="prose prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: tips }} />
        </div>
      )}
    </div>
  );

  // Points of a proposal to this player.
  const pointsOf = (options) => scoresheetPoints(roleScoresheet, options);
  const renderProposalItems = (proposal, small = false) => (
    <ProposalItems roleScoresheet={roleScoresheet} proposal={proposal} small={small} />
  );

  const isOwnPending = pendingProposal?.submittedBy === player.id;

  return (
    <div className="w-full min-h-screen bg-gray-300 p-6 pb-16 relative">
      {/* Bottom fade overlay */}
      <div className="fixed left-0 bottom-0 w-[85%] h-12 bg-gradient-to-t from-gray-300 to-transparent pointer-events-none z-10"></div>

      {/* Two columns: role/notes/instructions on the left, proposals on the
          right. No inner scroll boxes: the whole page scrolls as one. */}
      <div className="flex gap-4 items-start">
        <div className="w-1/2 min-w-0">
          <RoleNotesCard
            roleNarrative={roleNarrative}
            instructions={instructions}
            onQuit={() => setShowQuitModal(true)}
          />
        </div>

        {/* Proposals column */}
        <div ref={proposalsColumnRef} className="w-1/2 min-w-0 scroll-mt-6">
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

            {/* Calculator: feature checkboxes, with the live total + buttons beside them */}
            <CheckboxCalculator
              roleScoresheet={roleScoresheet}
              selectedOptions={selectedOptions}
              onChange={setSelectedOptions}
              roleRP={roleRP}
              footer={
                <>
                  <button
                    onClick={handleSubmitProposal}
                    disabled={pendingProposal !== null}
                    className={`px-4 py-2 rounded font-semibold transition-colors text-sm whitespace-nowrap ${
                      pendingProposal !== null
                        ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    {pendingProposal !== null ? "Proposal Pending" : "Submit Proposal"}
                  </button>
                  <button
                    onClick={() => setSelectedOptions({})}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    Reset All
                  </button>
                </>
              }
            />

            {/* Pending Proposal */}
            {pendingProposal ? (
              <div
                onClick={() => setWiggleStoppedId(pendingProposal.id)}
                className={`bg-white rounded-lg shadow-md p-6 ${
                  isOwnPending || pendingProposal.initialVotes[player.id] || wiggleStoppedId === pendingProposal.id ? "" : "animate-wiggle"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    Current Proposal
                  </h3>
                  {isOwnPending ? (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 font-bold text-sm rounded">
                      YOUR PROPOSAL
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 font-bold text-sm rounded">
                      SUBMITTED BY: {pendingProposal.submittedByName}
                    </span>
                  )}
                </div>

                {(() => {
                  const proposalPoints = pointsOf(pendingProposal.options);

                  return (
                    <div className="mb-2">
                      {/* Vote buttons or status, above the proposal */}
                      {pendingProposal.initialVotes[player.id] ? (
                        <div className="text-center p-4 bg-gray-100 rounded mb-4">
                          <p className="text-sm text-gray-600">
                            {isOwnPending ? (
                              <span className="font-bold">Your proposal</span>
                            ) : (
                              <>
                                You voted: <span className="font-bold">
                                  {pendingProposal.initialVotes[player.id] === "accept" ? "✓ Accept" : "✗ Reject"}
                                </span>
                              </>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Waiting for other players... ({Object.keys(pendingProposal.initialVotes).length}/{playerCount} voted)
                          </p>
                        </div>
                      ) : (
                        <div className="flex gap-3 mb-4">
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

                      {/* Proposal: details on the left, value to this player on the right */}
                      <div className="bg-blue-50 rounded p-4 flex gap-4 items-start">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-gray-700 mb-2">Proposal Details:</h4>
                          {renderProposalItems(pendingProposal)}
                        </div>
                        <div className="shrink-0 text-center bg-white rounded p-3 border border-gray-300 min-w-[140px]">
                          <p className="text-sm text-gray-600 mb-1">Value to you</p>
                          <p className="text-3xl font-bold text-blue-600">
                            {proposalPoints.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">points</p>
                          {roleRP !== undefined && (
                            <p className={`text-sm font-semibold mt-1 ${
                              proposalPoints >= roleRP ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {proposalPoints >= roleRP ? '✓ Beats your alternative!' : '✗ Worse than your alternative.'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-500">No pending proposal. Choose features above, then Submit Proposal.</p>
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
                    const proposalPoints = pointsOf(proposal.options);

                    // Count yes votes (from initial votes)
                    const yesVotes = Object.values(proposal.initialVotes).filter(v => v === "accept").length;

                    const voteColor = voteColorFor(yesVotes, playerCount);

                    return (
                      <div key={proposal.id} className="bg-gray-50 rounded p-4 border border-gray-200">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          {/* Proposal items list */}
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-bold text-gray-600 uppercase mb-2">
                              {proposal.submittedBy === player.id ? "Your proposal:" : `Proposal by ${proposal.submittedByName}:`}
                            </h5>
                            {renderProposalItems(proposal, true)}
                          </div>

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
        </div>
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

      {/* Negative Points Warning Modal */}
      {showNegativePointsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-sm w-full mx-4">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold text-red-600 mb-3">
                {showNegativePointsModal === "submit" ? "Cannot Submit Proposal" : "Cannot Accept Deal"}
              </h3>
              <p className="text-lg text-gray-700">
                {showNegativePointsModal === "submit"
                  ? "You can't propose a deal worth negative points to you."
                  : "You can't accept negative points."}
              </p>
            </div>
            <button
              onClick={() => setShowNegativePointsModal(false)}
              className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Blank Proposal Warning Modal */}
      {showBlankProposalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-sm w-full mx-4">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold text-red-600 mb-3">
                Cannot Submit Blank Proposal
              </h3>
              <p className="text-lg text-gray-700">
                You must select at least one item.
              </p>
            </div>
            <button
              onClick={() => setShowBlankProposalModal(false)}
              className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Quit Modal - Step 1 */}
      {showQuitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold text-red-600 mb-3">
                Are you sure you want to quit?
              </h3>
              <p className="text-lg text-gray-700">
                This will end the game for everybody, forefitting the change to get a bonus.  You should talk this through with other players before quitting.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowQuitModal(false)}
                className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
              >
                Return to Game
              </button>
              <button
                onClick={() => {
                  setShowQuitModal(false);
                  setShowQuitConfirmModal(true);
                }}
                className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
              >
                End Game for Everyone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quit Confirm Modal - Step 2 */}
      {showQuitConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold text-red-600 mb-3">
                Are you sure?
              </h3>
              <p className="text-lg text-gray-700">
                Ending the game now will end it for everybody.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowQuitConfirmModal(false)}
                className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
              >
                Return to Game
              </button>
              <button
                onClick={() => {
                  setShowQuitConfirmModal(false);
                  const now = Date.now();
                  const byName = player.get("displayName") || player.id;
                  const quitLog = game.get("quitLog") || [];
                  game.set("quitLog", [...quitLog, { event: "initiated", by: player.id, byName, timestamp: now }]);
                  const existing = player.get("heartbeat") || [];
                  player.set("heartbeat", [...existing, ["quitInitiated", now]]);
                  game.set("quitRequest", { by: player.id, byName, startedAt: now });
                }}
                className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
              >
                End Game for Everyone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quit Countdown Modal - Step 3 (shared: shown to all participants) */}
      {quitRequest && !game.get("forceQuit") && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⏳</div>
              {quitRequest.by === player.id ? (
                <h3 className="text-2xl font-bold text-red-600 mb-3">
                  The game will end in {quitSecondsLeft} second{quitSecondsLeft !== 1 ? 's' : ''}
                </h3>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-red-600 mb-3">
                    {quitRequest.byName} has clicked the quit button
                  </h3>
                  <p className="text-lg text-gray-700">
                    The game will end in {quitSecondsLeft} second{quitSecondsLeft !== 1 ? 's' : ''} unless {quitRequest.byName} cancels.
                  </p>
                </>
              )}
            </div>
            {quitRequest.by === player.id && (
              <button
                onClick={() => {
                  const now = Date.now();
                  const quitLog = game.get("quitLog") || [];
                  game.set("quitLog", [...quitLog, { event: "canceled", by: player.id, byName: quitRequest.byName, timestamp: now }]);
                  const existing = player.get("heartbeat") || [];
                  player.set("heartbeat", [...existing, ["quitCanceled", now]]);
                  game.set("quitRequest", null);
                }}
                className="w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold text-lg"
              >
                Cancel — Continue Game
              </button>
            )}
          </div>
        </div>
      )}

      {/* Welcome Modal */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-lg w-full mx-4">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🤝</div>
              <h3 className="text-3xl font-bold text-blue-700 mb-4">
                It's Time to Negotiate!
              </h3>
              <div className="text-left text-gray-700 leading-relaxed space-y-3">
                <p>
                  You can videochat with other participants, review your role narrative, and vote on proposals.
                </p>
                <p className="text-red-600 text-opacity-80 font-semibold">
                  To <strong>submit</strong> a proposal, click "Submit Proposal" in your calculator.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                player.set("hasSeenWelcomeModal", true);
                setShowWelcomeModal(false);
              }}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
            >
              Let's Go!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
