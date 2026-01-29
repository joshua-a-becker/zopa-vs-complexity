import React, { useState } from "react";
import { usePlayer } from "@empirica/core/player/classic/react";
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
 * - VIEW_NARRATIVE: User must click Narrative tab (tab blinks)
 * - VIEW_SCORING: User must click Scoring tab (tab blinks)
 * - MAKE_PROPOSAL_1: User creates their first proposal
 * - VOTE_ON_OWN_1: User votes on their own proposal (will fail)
 * - SHOW_FAILED_1: Show modal explaining proposal failed, prompt to modify
 * - MAKE_PROPOSAL_2: User modifies and resubmits
 * - VOTE_ON_OWN_2: User votes on their modified proposal (will also fail)
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
        This is a demo. <span className="font-bold text-blue-600">Start by clicking the Narrative tab</span> to learn about your role in this negotiation.
      </>
    ),
    buttonText: "OK"
  },
  NARRATIVE_VIEWED: {
    emoji: "📖",
    title: "Narrative View",
    message: (
      <>
        This is the narrative view. It gives your background story. Next, <span className="font-bold text-blue-600">click the Scoring tab</span> to see how proposals are scored, then try making a proposal.
      </>
    ),
    buttonText: "OK"
  },
  SCORING_VIEWED: {
    emoji: "🧮",
    title: "Scoring Calculator",
    message: "Now, use the scoring calculator to submit a proposal to your fictional roommates.",
    buttonText: "OK"
  },
  PROPOSAL_SUBMITTED: {
    emoji: "✅",
    emojiSize: "text-4xl",
    title: "Proposal Submitted",
    message: "Great! Now you have to vote on it, even though it's your own proposal.",
    buttonText: "OK"
  },
  MODIFIED_PROPOSAL_SUBMITTED: {
    emoji: "✅",
    emojiSize: "text-4xl",
    title: "Modified Proposal Submitted",
    message: "Good! Now vote on your modified proposal.",
    buttonText: "OK"
  },
  PROPOSAL_FAILED: {
    emoji: "🔧",
    title: "Try Modifying",
    message: (
      <>
        Everyone has now voted—unfortunately, your proposal didn't pass. Click the <span className="font-bold text-blue-600">Modify</span> button below your failed proposal to adjust it and try again. You can also modify other people's proposals.
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
  const [state, setState] = useState(() => {
    return player.get("demo_state") || STATES.INTRO;
  });

  // Track proposals the user has made (just for display)
  const [userProposals, setUserProposals] = useState(() => {
    return player.get("demo_userProposals") || [];
  });

  // Modal visibility (controlled by state)
  const [showModal, setShowModal] = useState(true);
  const [currentModal, setCurrentModal] = useState("INTRO");

  // Save state to player when it changes
  const saveState = (newState) => {
    setState(newState);
    player.set("demo_state", newState);
  };

  const saveProposals = (proposals) => {
    setUserProposals(proposals);
    player.set("demo_userProposals", proposals);
  };

  // Get what modal to show based on current state
  const getModalForState = () => {
    switch (currentModal) {
      case "INTRO": return MODALS.INTRO;
      case "NARRATIVE_VIEWED": return MODALS.NARRATIVE_VIEWED;
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

  // Handle tab change
  const handleTabChange = (tab) => {
    if (state === STATES.VIEW_NARRATIVE && tab === "narrative") {
      // User clicked Narrative tab, move to VIEW_SCORING and show modal
      saveState(STATES.VIEW_SCORING);
      setCurrentModal("NARRATIVE_VIEWED");
      setShowModal(true);
    } else if (state === STATES.VIEW_SCORING && tab === "calculator") {
      // User clicked Scoring tab, show modal before allowing proposal
      setCurrentModal("SCORING_VIEWED");
      setShowModal(true);
    }
    // For other states, tab change doesn't affect demo state
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowModal(false);

    // State transitions when closing modals
    if (currentModal === "INTRO") {
      saveState(STATES.VIEW_NARRATIVE);
    } else if (currentModal === "NARRATIVE_VIEWED") {
      // Stay in VIEW_SCORING, just close the modal
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
  const handleProposalSubmit = (proposalOptions) => {
    if (state === STATES.MAKE_PROPOSAL_1) {
      const newProposal = {
        id: `proposal-1-${Date.now()}`,
        options: proposalOptions,
        submittedBy: "user",
        status: "pending" // Will become "failed" after vote
      };
      saveProposals([newProposal]);
      saveState(STATES.VOTE_ON_OWN_1);
      setCurrentModal("PROPOSAL_SUBMITTED");
      setShowModal(true);
    } else if (state === STATES.MAKE_PROPOSAL_2) {
      const newProposal = {
        id: `proposal-2-${Date.now()}`,
        options: proposalOptions,
        submittedBy: "user",
        status: "pending"
      };
      // Mark first proposal as failed, add second
      const updated = userProposals.map(p => ({ ...p, status: "failed" }));
      updated.push(newProposal);
      saveProposals(updated);
      saveState(STATES.VOTE_ON_OWN_2);
      setCurrentModal("MODIFIED_PROPOSAL_SUBMITTED");
      setShowModal(true);
    }
  };

  // Handle vote on proposal
  const handleVote = (proposalId, vote) => {
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
      computerProposal: null // The computer's proposal (when applicable)
    };

    // Can submit proposal in MAKE_PROPOSAL_1 or MAKE_PROPOSAL_2
    data.canSubmitProposal = state === STATES.MAKE_PROPOSAL_1 || state === STATES.MAKE_PROPOSAL_2;

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
      // Generate computer proposal based on user's last proposal
      const lastUserProposal = userProposals[userProposals.length - 1];
      const computerOptions = lastUserProposal
        ? { ...lastUserProposal.options }
        : {};

      // Flip Kitchen_Storage to make it different
      computerOptions["Kitchen_Storage"] = computerOptions["Kitchen_Storage"] === 0 ? 1 : 0;

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
    <div className="h-screen flex">
      {/* Left side: Demo UI (70% width) */}
      <div className="w-[70%]">
        <DemoUI
          roleName="Demo Role"
          roleNarrative={demoNarrative}
          roleScoresheet={demoScoresheet}
          roleBATNA={demoBATNA}
          roleRP={demoRP}
          tips={demoTips}
          displayData={displayData}
          demoState={state}
          onProposalSubmit={handleProposalSubmit}
          onVote={handleVote}
          onFinalizeVote={handleFinalizeVote}
          onTabChange={handleTabChange}
        />
      </div>

      {/* Right side: Placeholder for video chat (30% width) */}
      <div className="w-[30%] bg-gray-800 flex items-center justify-center">
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
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-lg w-full mx-4">
            <div className={`${modalContent.emojiSize || "text-8xl"} mb-4 text-center`}>{modalContent.emoji}</div>
            <h2 className="text-2xl font-bold mb-4 text-center">{modalContent.title}</h2>
            <p className="text-lg text-gray-700 mb-6 text-center">{modalContent.message}</p>
            <button
              onClick={handleModalClose}
              className="w-full bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 font-bold text-xl"
            >
              {modalContent.buttonText}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
