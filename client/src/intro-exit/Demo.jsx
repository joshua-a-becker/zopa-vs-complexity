import React, { useState } from "react";
import { usePlayer } from "@empirica/core/player/classic/react";
import Markdown from "react-markdown";
import { DemoUI } from "./DemoUI";
import {
  demoNarrative,
  demoTips,
  demoBATNA,
  demoRP,
  demoScoresheet
} from "./demoContent";

/**
 * Demo component with explicit state machine.
 *
 * States:
 * - INTRO: Show initial modal explaining the demo
 * - VIEW_NARRATIVE: User reads the practice role (shown in a modal)
 * - VIEW_SCORING: (legacy; no longer entered — the calculator is always visible)
 * - MAKE_PROPOSAL_1: User creates their first proposal
 * - (VOTE_ON_OWN_1/2: legacy, no longer entered — submitting counts as the
 *    user's Accept vote, as in the real negotiation, and the scripted players
 *    vote it down straight away)
 * - SHOW_FAILED_1: Show modal explaining proposal failed, prompt to modify
 * - MAKE_PROPOSAL_2: User modifies and resubmits
 * - SHOW_COMPUTER_PROPOSAL: Show modal about computer's proposal
 * - VOTE_ON_COMPUTER: User votes on computer's proposal (must accept)
 * - FINALIZE: User finalizes the deal
 * - COMPLETE: Demo complete, show completion modal
 */

const STATES = {
  INTRO: "INTRO",
  VIEW_NARRATIVE: "VIEW_NARRATIVE",
  VIEW_SCORING: "VIEW_SCORING",
  MAKE_PROPOSAL_1: "MAKE_PROPOSAL_1",
  VOTE_ON_OWN_1: "VOTE_ON_OWN_1",
  SHOW_FAILED_1: "SHOW_FAILED_1",
  MAKE_PROPOSAL_2: "MAKE_PROPOSAL_2",
  VOTE_ON_OWN_2: "VOTE_ON_OWN_2",
  SHOW_COMPUTER_PROPOSAL: "SHOW_COMPUTER_PROPOSAL",
  VOTE_ON_COMPUTER: "VOTE_ON_COMPUTER",
  FINALIZE: "FINALIZE",
  COMPLETE: "COMPLETE"
};

const MODALS = {
  INTRO: {
    emoji: "📋",
    title: "Demo Negotiation",
    message: (
      <>
        This is a short practice negotiation. It shows you how the screen works. <span className="font-bold text-blue-600">Start by reading your practice role.</span>
      </>
    ),
    buttonText: "Read my role"
  },
  ROLE: {
    title: "Read your practice role",
    wide: true,
    message: (
      <div className="text-left prose prose-gray max-w-none text-gray-700 max-h-[55vh] overflow-auto pr-2">
        <Markdown>{demoNarrative}</Markdown>
      </div>
    ),
    buttonText: "I've read my role"
  },
  SCORING_VIEWED: {
    emoji: "🧮",
    title: "Scoring Calculator",
    message: (
      <>
        Your role stays on the left (Role tab), next to your private Notes and the Instructions. On the right is the <span className="font-bold text-blue-600">scoring calculator</span>: select features to see what a deal is worth to you, then use it to submit a proposal to your fictional roommates.
      </>
    ),
    buttonText: "OK"
  },
  PROPOSAL_FAILED: {
    emoji: "🔧",
    title: "Try Modifying",
    message: (
      <>
        Submitting a proposal counts as your vote to accept it, so you never vote on your own proposals. The other players have now voted—unfortunately, your proposal didn't pass. Click the <span className="font-bold text-blue-600">Modify</span> button below your failed proposal to adjust it and try again. You can also modify other people's proposals.
      </>
    ),
    buttonText: "OK"
  },
  COMPUTER_PROPOSAL: {
    emoji: "💡",
    title: "New Proposal",
    message: "Ok, looks like that proposal didn't pass either. But look, another player has made a proposal! This proposal would give you positive points. Please vote 'Accept' to continue the demo.",
    buttonText: "OK"
  },
  PLEASE_VOTE_YES: {
    emoji: "⚠️",
    title: "Please Vote Yes",
    message: "Normally you could vote no. For now, please vote yes to end the demo.",
    buttonText: "OK"
  },
  PLEASE_FINALIZE: {
    emoji: "⚠️",
    title: "Please Vote Finalize",
    message: "Normally you could keep discussing. For now, please finalize to end the demo.",
    buttonText: "OK"
  },
  COMPLETE: {
    emoji: "🎉",
    title: "Demo Complete",
    message: "Thank you for completing this demo! We'll now take you to the waiting page while we try to match you with other players.",
    buttonText: "Continue"
  }
};

export function Demo({ next }) {
  const player = usePlayer();

  // Single source of truth: the demo state
  // A saved state from the old flow (voting on your own proposal) restarts the demo.
  const savedState = player.get("demo_state");
  const isLegacyState = savedState === STATES.VOTE_ON_OWN_1 || savedState === STATES.VOTE_ON_OWN_2;
  const [state, setState] = useState(() => {
    return (!isLegacyState && savedState) || STATES.INTRO;
  });

  // Track proposals the user has made (just for display)
  const [userProposals, setUserProposals] = useState(() => {
    return isLegacyState ? [] : (player.get("demo_userProposals") || []);
  });

  // Whether the user has clicked Modify on a past proposal. The second
  // proposal must start from Modify, so that step actually teaches it.
  const [modifyUsed, setModifyUsed] = useState(() => {
    return isLegacyState ? false : !!player.get("demo_modifyUsed");
  });
  const handleModify = () => {
    if (state === STATES.MAKE_PROPOSAL_2 && !modifyUsed) {
      setModifyUsed(true);
      player.set("demo_modifyUsed", true);
    }
  };

  // Modal visibility (controlled by state)
  const [showModal, setShowModal] = useState(true);
  const [currentModal, setCurrentModal] = useState("INTRO");

  // Negative points warning modal
  const [showNegativePointsModal, setShowNegativePointsModal] = useState(false);

  // Save state to player when it changes
  const saveState = (newState) => {
    setState(newState);
    player.set("demo_state", newState);
  };

  const saveProposals = (proposals) => {
    setUserProposals(proposals);
    player.set("demo_userProposals", proposals);
  };

  // Calculate points for a proposal
  const calculateProposalPoints = (proposalOptions) => {
    return Object.entries(demoScoresheet).reduce((sum, [category]) => {
      const optionIdx = proposalOptions[category] ?? 1;
      return sum + (demoScoresheet[category]?.[optionIdx]?.score || 0);
    }, 0);
  };

  // Get what modal to show based on current state
  const getModalForState = () => {
    switch (currentModal) {
      case "INTRO": return MODALS.INTRO;
      case "ROLE": return MODALS.ROLE;
      case "SCORING_VIEWED": return MODALS.SCORING_VIEWED;
      case "PROPOSAL_SUBMITTED": return MODALS.PROPOSAL_SUBMITTED;
      case "MODIFIED_PROPOSAL_SUBMITTED": return MODALS.MODIFIED_PROPOSAL_SUBMITTED;
      case "PROPOSAL_FAILED": return MODALS.PROPOSAL_FAILED;
      case "COMPUTER_PROPOSAL": return MODALS.COMPUTER_PROPOSAL;
      case "PLEASE_VOTE_YES": return MODALS.PLEASE_VOTE_YES;
      case "PLEASE_FINALIZE": return MODALS.PLEASE_FINALIZE;
      case "COMPLETE": return MODALS.COMPLETE;
      default: return null;
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowModal(false);

    // State transitions when closing modals
    if (currentModal === "INTRO") {
      saveState(STATES.VIEW_NARRATIVE);
      setCurrentModal("ROLE");
      setShowModal(true);
    } else if (currentModal === "ROLE") {
      setCurrentModal("SCORING_VIEWED");
      setShowModal(true);
    } else if (currentModal === "SCORING_VIEWED") {
      // User closed scoring modal, now they can make a proposal
      saveState(STATES.MAKE_PROPOSAL_1);
    } else if (currentModal === "PROPOSAL_SUBMITTED") {
      // Stay in VOTE_ON_OWN_1, just close the modal
    } else if (currentModal === "PROPOSAL_FAILED") {
      saveState(STATES.MAKE_PROPOSAL_2);
    } else if (currentModal === "MODIFIED_PROPOSAL_SUBMITTED") {
      // Stay in VOTE_ON_OWN_2, just close the modal
    } else if (currentModal === "COMPUTER_PROPOSAL") {
      saveState(STATES.VOTE_ON_COMPUTER);
    } else if (currentModal === "COMPLETE") {
      next();
    }
    // For PLEASE_VOTE_YES and PLEASE_FINALIZE, just close
  };

  // Handle proposal submission
  // Submitting counts as the user's Accept vote (people never vote on their
  // own proposal). The scripted players then vote it down 2/3.
  const handleProposalSubmit = (proposalOptions) => {
    if (state !== STATES.MAKE_PROPOSAL_1 && state !== STATES.MAKE_PROPOSAL_2) return;

    // Same rule as the real negotiation: you can't propose a deal worth
    // negative points to you.
    if (calculateProposalPoints(proposalOptions) < 0) {
      setShowNegativePointsModal("submit");
      return;
    }

    const n = state === STATES.MAKE_PROPOSAL_1 ? 1 : 2;
    const newProposal = {
      id: `proposal-${n}-${Date.now()}`,
      options: proposalOptions,
      submittedBy: "user",
      status: "failed",
      userVote: "accept"
    };
    if (n === 1) {
      saveProposals([newProposal]);
      saveState(STATES.SHOW_FAILED_1);
      setCurrentModal("PROPOSAL_FAILED");
    } else {
      saveProposals([...userProposals, newProposal]);
      saveState(STATES.SHOW_COMPUTER_PROPOSAL);
      setCurrentModal("COMPUTER_PROPOSAL");
    }
    setShowModal(true);
  };

  // Handle vote on proposal
  const handleVote = (proposalId, vote) => {
    // If voting "accept", check if proposal has negative points
    if (vote === "accept") {
      let proposal = null;

      // Find the proposal being voted on
      if (state === STATES.VOTE_ON_OWN_1 || state === STATES.VOTE_ON_OWN_2) {
        proposal = userProposals.find(p => p.id === proposalId);
      } else if (state === STATES.VOTE_ON_COMPUTER) {
        // Computer proposal (from displayData)
        const computerOptions = {
          "Pets_Allowed": 0,
          "Overnight_Guests": 0,
          "Kitchen_Storage": 1,
          "Clean_Ourselves": 1,
          "Late_Nights_OK": 0,
          "Cooler_Winter_Temp": 1,
          "Shared_Groceries": 1,
          "Living_Room": 0
        };
        proposal = { options: computerOptions };
      }

      if (proposal) {
        const proposalPoints = calculateProposalPoints(proposal.options);
        if (proposalPoints < 0) {
          setShowNegativePointsModal(true);
          return;
        }
      }
    }

    if (state === STATES.VOTE_ON_OWN_1) {
      // User voted on their first proposal - it fails regardless
      const updated = userProposals.map(p =>
        p.id === proposalId ? { ...p, status: "failed", userVote: vote } : p
      );
      saveProposals(updated);
      saveState(STATES.SHOW_FAILED_1);
      setCurrentModal("PROPOSAL_FAILED");
      setShowModal(true);
    } else if (state === STATES.VOTE_ON_OWN_2) {
      // User voted on their second proposal - it also fails, then computer proposal appears
      const updated = userProposals.map(p =>
        p.id === proposalId ? { ...p, status: "failed", userVote: vote } : p
      );
      saveProposals(updated);
      saveState(STATES.SHOW_COMPUTER_PROPOSAL);
      setCurrentModal("COMPUTER_PROPOSAL");
      setShowModal(true);
    } else if (state === STATES.VOTE_ON_COMPUTER) {
      if (vote === "reject") {
        // Must accept - show warning
        setCurrentModal("PLEASE_VOTE_YES");
        setShowModal(true);
      } else {
        // Accepted - move to finalize
        saveState(STATES.FINALIZE);
      }
    }
  };

  // Handle finalize vote
  const handleFinalizeVote = (decision) => {
    if (state === STATES.FINALIZE) {
      if (decision === "continue") {
        // Must finalize - show warning
        setCurrentModal("PLEASE_FINALIZE");
        setShowModal(true);
      } else {
        // Finalized - demo complete
        saveState(STATES.COMPLETE);
        setCurrentModal("COMPLETE");
        setShowModal(true);
      }
    }
  };

  // Build the display data based on current state
  const buildDisplayData = () => {
    const data = {
      proposals: [], // All proposals (for history)
      currentProposal: null, // The proposal user needs to vote on
      showFinalize: false, // Whether to show finalize modal
      canSubmitProposal: false, // Whether user can submit new proposal
      computerProposal: null, // The computer's proposal (when applicable)
      submitBlockedMessage: null // Message to show if submit is blocked
    };

    // Can submit proposal in MAKE_PROPOSAL_1 or MAKE_PROPOSAL_2
    data.canSubmitProposal = state === STATES.MAKE_PROPOSAL_1 || state === STATES.MAKE_PROPOSAL_2;

    // Set blocked message for early states
    if (state === STATES.INTRO || state === STATES.VIEW_NARRATIVE || state === STATES.VIEW_SCORING) {
      data.submitBlockedMessage = "Please read your practice role first.";
    }

    // The second proposal has to start from the Modify button.
    if (state === STATES.MAKE_PROPOSAL_2 && !modifyUsed) {
      data.submitBlockedMessage = "First click the Modify button under your proposal in the Proposal History, then adjust it and submit again.";
      data.highlightModify = true;
    }

    // Add user proposals to history (with computed display data)
    userProposals.forEach(p => {
      const displayProposal = {
        ...p,
        submittedByName: "You",
        isUserProposal: true
      };

      if (p.status === "pending") {
        // This is the current proposal to vote on
        data.currentProposal = {
          ...displayProposal,
          // Fake vote counts based on state
          initialVotes: state === STATES.VOTE_ON_OWN_1 || state === STATES.VOTE_ON_OWN_2
            ? { computer_1: "accept", computer_2: "reject" } // Computers already voted
            : {}
        };
      } else {
        // Add to history with vote results
        data.proposals.push({
          ...displayProposal,
          initialVotes: {
            user: p.userVote || "accept",
            computer_1: "accept",
            computer_2: "reject"
          }
        });
      }
    });

    // In VOTE_ON_COMPUTER or FINALIZE, show computer's proposal
    if (state === STATES.VOTE_ON_COMPUTER || state === STATES.FINALIZE) {
      // Computer proposal using vector 11001001
      // This corresponds to: Pets(1), Overnight(1), Kitchen(0), Clean(0), LateNights(1), CoolerTemp(0), SharedGroceries(0), LivingRoom(1)
      const computerOptions = {
        "Pets_Allowed": 0,           // Yes, pets allowed (+12)
        "Overnight_Guests": 0,       // Anytime is fine (+10)
        "Kitchen_Storage": 1,        // Some private shelves (0)
        "Clean_Ourselves": 1,        // DIY cleaning rotation (0)
        "Late_Nights_OK": 0,         // No strict noise curfew (0)
        "Cooler_Winter_Temp": 1,     // Keep it cooler (0)
        "Shared_Groceries": 1,       // Buy basics together (0)
        "Living_Room": 0             // Cozy and lived-in (0)
      };

      data.computerProposal = {
        id: "computer-proposal",
        options: computerOptions,
        submittedBy: "computer_1",
        submittedByName: "Player A",
        isUserProposal: false,
        initialVotes: state === STATES.FINALIZE
          ? { computer_1: "accept", computer_2: "accept", user: "accept" }
          : { computer_1: "accept", computer_2: "accept" }
      };

      if (state === STATES.VOTE_ON_COMPUTER) {
        data.currentProposal = data.computerProposal;
      } else if (state === STATES.FINALIZE) {
        data.showFinalize = true;
        data.acceptedProposal = data.computerProposal;
      }
    }

    return data;
  };

  const displayData = buildDisplayData();
  const modalContent = getModalForState();

  return (
    <div className="min-h-screen flex">
      {/* Left side: Demo UI (85% width, as in the real negotiation); scrolls with the page */}
      <div className="w-[85%]">
        <DemoUI
          roleNarrative={demoNarrative}
          roleScoresheet={demoScoresheet}
          roleBATNA={demoBATNA}
          roleRP={demoRP}
          tips={demoTips}
          displayData={displayData}
          onProposalSubmit={handleProposalSubmit}
          onVote={handleVote}
          onFinalizeVote={handleFinalizeVote}
          onModify={handleModify}
        />
      </div>

      {/* Right side: Placeholder for video chat (15% width), fixed like the real video panel */}
      <div className="w-[15%] fixed right-0 top-0 h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎥</div>
          <p className="text-white text-xl font-semibold">
            Video Chat Will Go Here
          </p>
        </div>
      </div>

      {/* Demo Modal */}
      {showModal && modalContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`bg-white rounded-lg shadow-2xl p-8 w-full mx-4 ${modalContent.wide ? "max-w-3xl" : "max-w-lg"}`}>
            {modalContent.emoji && (
              <div className={`${modalContent.emojiSize || "text-8xl"} mb-4 text-center`}>{modalContent.emoji}</div>
            )}
            <h2 className="text-2xl font-bold mb-4 text-center">{modalContent.title}</h2>
            <div className="text-lg text-gray-700 mb-6 text-center">{modalContent.message}</div>
            <button
              onClick={handleModalClose}
              className="w-full bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 font-bold text-xl"
            >
              {modalContent.buttonText}
            </button>
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
    </div>
  );
}
