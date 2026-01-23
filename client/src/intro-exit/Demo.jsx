import React, { useState, useEffect } from "react";
import { usePlayer } from "@empirica/core/player/classic/react";
import { DemoMaterialsPanel } from "./DemoMaterialsPanel";
import {
  demoNarrative,
  demoTips,
  demoBATNA,
  demoRP,
  demoScoresheet
} from "./demoContent";

export function Demo({ next }) {
  const player = usePlayer();

  // Helper function to get modal content by type
  const getModalContent = (type) => {
    const modals = {
      initial: {
        emoji: "📋",
        title: "Demo Negotiation",
        message: (
          <>
            This is a demo. <span className="font-bold text-green-600">Start by making a proposal</span> for your negotiation partners, as you would in the live game.
          </>
        ),
        buttonText: "OK"
      },
      proposalSubmitted: {
        emoji: "✅",
        emojiSize: "text-4xl",
        title: "Proposal Submitted",
        message: "Great! Now you have to vote on it, even though it's your own proposal.",
        buttonText: "OK"
      },
      modifiedProposalSubmitted: {
        emoji: "✅",
        emojiSize: "text-4xl",
        title: "Modified Proposal Submitted",
        message: "Good! Now vote on your modified proposal.",
        buttonText: "OK"
      },
      tryModifying: {
        emoji: "🔧",
        title: "Try Modifying",
        message: (
          <>
            Everyone has now voted-unfortunately, your proposal didn't pass. Click the <span className="font-bold text-blue-600">Modify</span> button below your failed proposal to adjust it and try again. You can also modify other people's proposals.
          </>
        ),
        buttonText: "OK"
      },
      newProposal: {
        emoji: "💡",
        title: "New Proposal",
        message: "Ok, looks like that proposal didn't pass either. But look, another player has made a proposal! This proposal would give you positive points. Please vote 'Accept' to continue the demo.",
        buttonText: "OK"
      },
      pleaseVoteYes: {
        emoji: "⚠️",
        title: "Please Vote Yes",
        message: "Normally you could vote no. For now, please vote yes to end the demo.",
        buttonText: "OK"
      },
      pleaseVoteFinalize: {
        emoji: "⚠️",
        title: "Please Vote Finalize",
        message: "Normally you could vote no. For now, please vote yes to end the demo.",
        buttonText: "OK"
      },
      demoComplete: {
        emoji: "🎉",
        title: "Demo Complete",
        message: "Thank you for completing this demo! We'll now take you to the waiting page while we try to match you with other players.",
        buttonText: "Continue"
      }
    };
    return modals[type] || modals.initial;
  };

  // Initialize state from player storage or defaults
  const [demoState, setDemoState] = useState(() => {
    return player.get("intro_demoState") || "initial";
  });
  const [showModal, setShowModal] = useState(() => {
    return player.get("intro_showModal") !== undefined ? player.get("intro_showModal") : false;
  });
  const [currentModalType, setCurrentModalType] = useState(() => {
    return player.get("intro_currentModalType") || "initial";
  });

  // Save state to player storage whenever it changes
  useEffect(() => {
    player.set("intro_demoState", demoState);
  }, [demoState, player]);

  useEffect(() => {
    player.set("intro_showModal", showModal);
  }, [showModal, player]);

  useEffect(() => {
    player.set("intro_currentModalType", currentModalType);
  }, [currentModalType, player]);

  // Get current modal content dynamically
  const modalContent = getModalContent(currentModalType);

  // Initialize player state for demo
  useEffect(() => {
    player.set("intro_playerCount", 3);
    player.set("intro_roleName", "Demo Role");
    if (!player.get("intro_proposalHistory")) {
      player.set("intro_proposalHistory", []);
    }
  }, [player]);

  // Show initial modal
  useEffect(() => {
    if (demoState === "initial" && !showModal) {
      setCurrentModalType("initial");
      setShowModal(true);
    }
  }, [demoState, showModal]);

  // Handle proposal submission
  const handleProposalSubmit = (proposal) => {
    console.log("handleProposalSubmit called, demoState:", demoState);
    if (demoState !== "waitingForUserProposal" && demoState !== "waitingForUserProposal2") return;

    // Add simulated computer player votes
    const history = player.get("intro_proposalHistory") || [];
    const updatedHistory = [...history];
    const currentProposal = updatedHistory[updatedHistory.length - 1];

    if (currentProposal) {
      // Computer 1 accepts, Computer 2 rejects
      currentProposal.initialVotes["computer_1"] = "accept";
      currentProposal.initialVotes["computer_2"] = "reject";
      player.set("intro_proposalHistory", updatedHistory);

      // Show modal based on which proposal this is
      if (demoState === "waitingForUserProposal") {
        console.log("Transitioning to waitingForUserVote1");
        setCurrentModalType("proposalSubmitted");
        setShowModal(true);
        setDemoState("waitingForUserVote1");
      } else if (demoState === "waitingForUserProposal2") {
        console.log("Transitioning to waitingForUserVote2");
        setCurrentModalType("modifiedProposalSubmitted");
        setShowModal(true);
        setDemoState("waitingForUserVote2");
      }
    }
  };

  // Handle initial vote (on user's own proposal)
  const handleVote = (proposalId, vote) => {
    console.log("Demo.jsx handleVote called:", { demoState, proposalId, vote });
    if (demoState === "waitingForUserVote1") {
      // Record the user's vote
      const history = player.get("intro_proposalHistory") || [];
      const updatedHistory = [...history];
      const proposal = updatedHistory.find(p => p.id === proposalId);
      if (proposal) {
        proposal.initialVotes[player.id] = vote;
        player.set("intro_proposalHistory", updatedHistory);
      }

      // User voted on their first proposal - it fails
      // Now prompt them to modify it
      setCurrentModalType("tryModifying");
      setShowModal(true);
      setDemoState("promptModify");
    } else if (demoState === "waitingForUserVote2") {
      // User voted on their second (modified) proposal
      // Add computer votes immediately (computer_1 accept, computer_2 reject) so proposal completes
      console.log("waitingForUserVote2 block entered");
      const history = player.get("intro_proposalHistory") || [];
      const updatedHistory = [...history];
      const userProposal = updatedHistory.find(p => p.id === proposalId);
      console.log("userProposal found:", !!userProposal, proposalId);

      if (userProposal) {
        // Record the user's vote
        userProposal.initialVotes[player.id] = vote;

        // Add computer votes to complete voting on user's 2nd proposal
        userProposal.initialVotes["computer_1"] = "accept";
        userProposal.initialVotes["computer_2"] = "reject";
        // Now proposal fails (2 accept, 1 reject... wait no, we need it to fail)
        // Actually with 1 reject it fails per the rules

        // Create computer proposal by flipping Kitchen_Storage from user's last proposal
        const computerOptions = { ...userProposal.options };
        // Flip Kitchen_Storage: if it's 0 (included), make it 1 (excluded); if 1, make it 0
        computerOptions["Kitchen_Storage"] = computerOptions["Kitchen_Storage"] === 0 ? 1 : 0;

        const computerProposal = {
          id: `${Date.now()}-computer_1`,
          submittedBy: "computer_1",
          submittedByName: "Player A",
          timestamp: Date.now(),
          options: computerOptions,
          initialVotes: {
            "computer_1": "accept",
            "computer_2": "accept"
          },
          finalVotes: {},
          modalDismissed: {}
        };

        updatedHistory.push(computerProposal);
        player.set("intro_proposalHistory", updatedHistory);

        // Show modal
        console.log("Setting newProposal modal and transitioning to waitingForComputerInitialVote");
        setCurrentModalType("newProposal");
        setShowModal(true);
        setDemoState("waitingForComputerInitialVote");
      }
    } else if (demoState === "waitingForComputerInitialVote") {
      // User voted on computer proposal (initial vote)
      const history = player.get("intro_proposalHistory") || [];
      const updatedHistory = [...history];
      const proposal = updatedHistory.find(p => p.id === proposalId);

      if (vote === "reject") {
        // Don't record the vote - show error modal
        setCurrentModalType("pleaseVoteYes");
        setShowModal(true);
        // Stay in same state
      } else if (vote === "accept") {
        // Record the user's vote
        if (proposal) {
          proposal.initialVotes[player.id] = vote;
          player.set("intro_proposalHistory", updatedHistory);
        }

        // User accepted - all 3 voted accept, triggers finalize modal
        setDemoState("waitingForComputerFinalVote");
      }
    }
  };

  // Handle finalize vote
  const handleFinalizeVote = (proposalId, decision) => {
    if (demoState === "waitingForComputerFinalVote") {
      if (decision === "continue") {
        // Don't record the vote - show error modal
        setCurrentModalType("pleaseVoteFinalize");
        setShowModal(true);
        // Stay in same state
      } else if (decision === "finalize") {
        // User voted to finalize - record it
        const history = player.get("intro_proposalHistory") || [];
        const updatedHistory = [...history];
        const proposal = updatedHistory.find(p => p.id === proposalId);

        if (proposal) {
          // Record user's finalize vote
          proposal.finalVotes[player.id] = decision;

          // Add computer finalize votes
          proposal.finalVotes["computer_1"] = "finalize";
          proposal.finalVotes["computer_2"] = "finalize";
          player.set("intro_proposalHistory", updatedHistory);

          // Show completion modal
          setCurrentModalType("demoComplete");
          setShowModal(true);
          setDemoState("complete");
        }
      }
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowModal(false);

    // Transition states based on current state
    if (demoState === "initial") {
      setDemoState("waitingForUserProposal");
    } else if (demoState === "promptModify") {
      setDemoState("waitingForUserProposal2");
    } else if (demoState === "complete") {
      // Move to next step
      next();
    }
  };

  return (
    <div className="h-screen flex">
      {/* Left side: Demo Materials Panel (70% width) */}
      <div className="w-[70%]">
        <DemoMaterialsPanel
          roleName="Demo Role"
          roleNarrative={demoNarrative}
          roleScoresheet={demoScoresheet}
          roleBATNA={demoBATNA}
          roleRP={demoRP}
          tips={demoTips}
          onProposalSubmit={handleProposalSubmit}
          onVote={handleVote}
          onFinalizeVote={handleFinalizeVote}
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
      {showModal && (
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
