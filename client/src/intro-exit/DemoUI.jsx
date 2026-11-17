import React, { useRef, useState } from "react";
import { RoleNotesCard } from "../components/RoleNotesCard";
import { CheckboxCalculator, ProposalItems, pointsOf, voteColor } from "../components/CheckboxCalculator";

/**
 * DemoUI - the negotiation panel for the tutorial. Same two-column,
 * whole-page-scroll layout as MaterialsPanel (Role / Notes / Instructions card
 * on the left; calculator, pending proposal and history on the right), but it
 * renders what displayData tells it to; the tutorial state machine lives in
 * Demo.jsx.
 */
export function DemoUI({
  roleNarrative,
  roleScoresheet,
  roleBATNA,
  roleRP,
  tips,
  displayData,
  onProposalSubmit,
  onVote,
  onFinalizeVote,
  onModify,
}) {
  const proposalsColumnRef = useRef(null);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [showEmptyProposalError, setShowEmptyProposalError] = useState(false);
  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);

  const playerCount = 3; // Hardcoded for demo
  const pendingProposal = displayData.currentProposal;

  // Handle proposal submission
  const handleSubmitProposal = () => {
    if (displayData.submitBlockedMessage) {
      setShowBlockedModal(true);
      return;
    }
    if (!displayData.canSubmitProposal) return;

    setHasSubmittedOnce(true);

    // At least one feature must be included
    if (!Object.values(selectedOptions).some(val => val === 0)) {
      setShowEmptyProposalError(true);
      setTimeout(() => setShowEmptyProposalError(false), 3000);
      return;
    }

    onProposalSubmit?.({ ...selectedOptions });
  };

  // Handle modifying a proposal: load it into the calculator and scroll there
  const handleModifyProposal = (proposalOptions) => {
    setSelectedOptions(proposalOptions);
    onModify?.();
    proposalsColumnRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const instructions = tips ? (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-4">Tips on Negotiation</h3>
      <div className="prose prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: tips }} />
    </div>
  ) : null;

  const submitDisabled = !displayData.canSubmitProposal && !displayData.submitBlockedMessage;

  return (
    <>
      <style>{`
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
      <div className="w-full min-h-screen bg-gray-300 p-6 pb-16 relative">
        {/* Bottom fade overlay */}
        <div className="fixed left-0 bottom-0 w-[85%] h-12 bg-gradient-to-t from-gray-300 to-transparent pointer-events-none z-10"></div>

        {/* Two columns, as in the real negotiation. No inner scroll boxes: the whole page scrolls. */}
        <div className="flex gap-4 items-start">
          <div className="w-1/2 min-w-0">
            <RoleNotesCard
              roleNarrative={roleNarrative}
              instructions={instructions}
              notesAttribute="tutorialNotes"
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
                  {roleRP !== undefined && (
                    <p className="text-sm text-gray-700">
                      If you don't reach agreement, you will earn <span className="font-bold">0 points</span> (no bonus).
                    </p>
                  )}
                </div>
              )}

              {/* Calculator */}
              <CheckboxCalculator
                roleScoresheet={roleScoresheet}
                selectedOptions={selectedOptions}
                onChange={setSelectedOptions}
                roleRP={roleRP}
                footer={
                  <>
                    <button
                      onClick={handleSubmitProposal}
                      disabled={submitDisabled}
                      className={`px-4 py-2 rounded font-semibold transition-colors text-sm whitespace-nowrap ${
                        displayData.submitBlockedMessage
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : submitDisabled
                          ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                          : !hasSubmittedOnce
                          ? "bg-green-600 text-white hover:bg-green-700 animate-pulse-button"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      {submitDisabled ? "Proposal Pending" : "Submit Proposal"}
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
                  </>
                }
              />

              {/* Current Proposal to vote on */}
              {pendingProposal ? (
                <div className={`bg-white rounded-lg shadow-md p-6 ${pendingProposal.isUserProposal ? "" : "animate-wiggle"}`}>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Current Proposal</h3>
                    {pendingProposal.isUserProposal ? (
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
                    const proposalPoints = pointsOf(roleScoresheet, pendingProposal.options);
                    return (
                      <div className="mb-2">
                        {/* Vote buttons, above the proposal */}
                        <div className="flex gap-3 mb-4">
                          <button
                            onClick={() => onVote(pendingProposal.id, "accept")}
                            className="flex-1 px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-semibold"
                          >
                            ✓ Accept
                          </button>
                          <button
                            onClick={() => onVote(pendingProposal.id, "reject")}
                            className="flex-1 px-4 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-semibold"
                          >
                            ✗ Reject
                          </button>
                        </div>

                        {/* Proposal: details on the left, value to this player on the right */}
                        <div className="bg-blue-50 rounded p-4 flex gap-4 items-start">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-gray-700 mb-2">Proposal Details:</h4>
                            <ProposalItems roleScoresheet={roleScoresheet} proposal={pendingProposal} />
                          </div>
                          <div className="shrink-0 text-center bg-white rounded p-3 border border-gray-300 min-w-[140px]">
                            <p className="text-sm text-gray-600 mb-1">Value to you</p>
                            <p className="text-3xl font-bold text-blue-600">{proposalPoints.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">points</p>
                            {roleRP !== undefined && (
                              <p className={`text-sm font-semibold mt-1 ${proposalPoints >= roleRP ? 'text-green-600' : 'text-red-600'}`}>
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

              {/* Proposal History */}
              {displayData.proposals.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Proposal History</h3>
                  <div className="space-y-3">
                    {[...displayData.proposals].reverse().map((proposal) => {
                      const proposalPoints = pointsOf(roleScoresheet, proposal.options);
                      const accepts = Object.values(proposal.initialVotes || {}).filter(v => v === "accept").length;

                      return (
                        <div key={proposal.id} className="bg-gray-50 rounded p-4 border border-gray-200">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1 min-w-0">
                              <h5 className="text-xs font-bold text-gray-600 uppercase mb-2">
                                {proposal.isUserProposal ? "Your proposal:" : `Proposal by ${proposal.submittedByName}:`}
                              </h5>
                              <ProposalItems roleScoresheet={roleScoresheet} proposal={proposal} small />
                            </div>
                            <div className="text-center bg-white rounded p-3 border border-gray-300 min-w-[120px]">
                              <p className={`text-3xl font-bold ${voteColor(accepts, playerCount)} mb-1`}>
                                {accepts}/{playerCount}
                              </p>
                              <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Accepted</p>
                              <p className="text-lg font-bold text-gray-700">{proposalPoints.toFixed(2)} pts</p>
                            </div>
                          </div>
                          <button
                            className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium ${
                              displayData.highlightModify ? "animate-pulse-button" : ""
                            }`}
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

        {/* Finalize Modal */}
        {displayData.showFinalize && displayData.acceptedProposal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
              <div className="text-center mb-6">
                <h3 className="text-3xl font-bold text-green-700 mb-3">Congratulations!</h3>
                <p className="text-lg text-gray-700 mb-2">Everyone has accepted this proposal.</p>
                <p className="text-md text-gray-600">Would you like to finalize this deal, or keep discussing?</p>
              </div>
              <div className="text-center mb-6 p-4 bg-green-50 rounded">
                <p className="text-sm text-gray-600 mb-1">Your score with this proposal:</p>
                <p className="text-4xl font-bold text-green-600">
                  {pointsOf(roleScoresheet, displayData.acceptedProposal.options).toFixed(2)} points
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
