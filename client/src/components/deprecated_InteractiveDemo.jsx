/**
 * InteractiveDemo — group interactive demo stage.
 *
 * Phase sequence is FULLY DERIVED from demoProposalHistory + per-player flags
 * via computeDemoState() — no stored demo_phase in round state:
 *
 *   "intro"          — any player missing demo_viewedNarrative or demo_viewedScoring
 *   "propose_k"      — history[k] absent (focal player k needs to submit)
 *   "vote_k"         — history[k] exists but unresolved
 *   "final_propose"  — all K cycle proposals resolved; history[K] absent
 *   "final_vote"     — history[K] exists; not all initial votes are "accept"
 *   "final_finalize" — all initial votes "accept"; not all final votes are "continue"
 *   "complete"       — all final votes are "continue"
 */
import React, { useState, useEffect, useRef } from "react";
import {
  usePlayer,
  usePlayers,
  useRound,
  useGame,
} from "@empirica/core/player/classic/react";
import { InteractionPanel } from "./InteractionPanel";
import { DemoMaterialsPanel } from "./DemoMaterialsPanel";
import {
  demoNarrative,
  demoBATNA,
  demoRP,
  demoScoresheet,
} from "../intro-exit/demoContent";

// ─── pure state machine ────────────────────────────────────────────────────────

function computeDemoState(history, players, focalOrder) {
  if (!focalOrder || focalOrder.length === 0) return null;
  if (!players    || players.length === 0)    return null;

  const K = focalOrder.length;

  // Gate: every player must view Narrative then Scoring
  const allViewed = players.every(
    p => p.get("demo_viewedNarrative") && p.get("demo_viewedScoring")
  );
  if (!allViewed) return "intro";

  // Cycle proposals: history[0..K-1]
  for (let k = 0; k < K; k++) {
    const proposal    = history[k];
    if (!proposal) return `propose_${k}`;
    const votes     = proposal.initialVotes || {};
    const voteCount = Object.keys(votes).length;
    // Advance only when ALL players have voted — the focal player's mandatory
    // NO guarantees a reject, but everyone should experience voting first.
    const resolved  = voteCount >= players.length;
    if (!resolved) return `vote_${k}`;
  }

  // Final proposal: history[K]
  const finalProposal = history[K];
  if (!finalProposal) return "final_propose";

  const finalInitial = finalProposal.initialVotes || {};
  const allAccepted  =
    Object.keys(finalInitial).length >= players.length &&
    Object.values(finalInitial).every(v => v === "accept");
  if (!allAccepted) return "final_vote";

  const finalVotes   = finalProposal.finalVotes || {};
  const allContinued =
    Object.keys(finalVotes).length >= players.length &&
    Object.values(finalVotes).every(v => v === "continue");
  if (!allContinued) return "final_finalize";

  return "complete";
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const displayName = (p) => (p ? p.get("displayName") || "a player" : "a player");

// ─── component ────────────────────────────────────────────────────────────────

export function InteractiveDemo({ profileComponent }) {
  const player  = usePlayer();
  const players = usePlayers();
  const round   = useRound();
  const game    = useGame();  // eslint-disable-line no-unused-vars

  // ── shared demo state (fully derived — never stored) ─────────────────────────
  const focalOrder = round.get("demo_focal_order") || [];
  const history    = round.get("demoProposalHistory") || [];
  const demoState  = computeDemoState(history, players, focalOrder);

  // ── per-player progress ──────────────────────────────────────────────────────
  const myViewedNarrative = player.get("demo_viewedNarrative") || false;
  const myViewedScoring   = player.get("demo_viewedScoring")   || false;

  // ── welcome modal ────────────────────────────────────────────────────────────
  const [welcomeDismissed, setWelcomeDismissed] = useState(
    () => player.get("demo_welcomeDismissed") || false
  );

  // ── instruction overlay modal ────────────────────────────────────────────────
  // { emoji, title, message, buttonText, onClose? }
  const [instructionModal, setInstructionModal] = useState(null);

  // ── parse demoState for focal player ─────────────────────────────────────────
  const stateMatch     = (demoState || "").match(/^(propose|vote)_(\d+)$/);
  const stateK         = stateMatch ? parseInt(stateMatch[2]) : 0;
  const currentFocalId = focalOrder[stateK] || focalOrder[0];
  const isFocalPlayer  = player.id === currentFocalId;
  const isFirstFocal   = player.id === focalOrder[0];

  // ── helper: build modal content for a given demoState ────────────────────────
  const getPhaseModal = (ph) => {
    if (!ph || focalOrder.length === 0 || players.length === 0) return null;

    const km      = ph.match(/^(propose|vote)_(\d+)$/);
    const k       = km ? parseInt(km[2]) : 0;
    const focalId = focalOrder[k] || focalOrder[0];
    const focal   = players.find(p => p.id === focalId);
    const isMe    = player.id === focalId;
    const name    = displayName(focal);
    const focal0  = players.find(p => p.id === focalOrder[0]);
    const name0   = displayName(focal0);

    switch (ph) {
      case "intro":
        return {
          emoji: "📋",
          title: "Step 1: Read Your Materials",
          message:
            "First, click the Narrative tab to learn about the scenario. Then click the Scoring tab to understand how proposals are scored.",
          buttonText: "OK",
        };

      case "final_propose":
        return {
          emoji: "🏁",
          title: player.id === focalOrder[0] ? "Submit the Final Proposal!" : "Final Proposal Coming",
          message:
            player.id === focalOrder[0]
              ? "Almost done! Go to the Scoring tab, check ALL items, and submit a proposal."
              : `${name0} will now submit a final proposal with all items checked. Please wait.`,
          buttonText: "OK",
        };

      case "final_vote":
        return {
          emoji: "✅",
          title: "Vote YES!",
          message: "Please go to the Proposal tab and vote YES to accept this proposal.",
          buttonText: "OK",
        };

      case "final_finalize":
        return {
          emoji: "🎯",
          title: "Keep Discussing!",
          message:
            "Everyone accepted the proposal! In the popup that appeared, please click 'Keep Discussing'.",
          buttonText: "OK",
        };

      case "complete":
        return {
          emoji: "🎉",
          title: "Demo Complete!",
          message:
            "Excellent work! You've practiced the full negotiation workflow. We'll now move on to your actual negotiation role.",
          buttonText: "Continue",
          onClose: () => { player.stage.set("submit", true); },
        };

      default:
        if (ph.startsWith("propose_")) {
          return {
            emoji: "📝",
            title: isMe ? "Your Turn to Submit!" : `${name}'s Turn`,
            message: isMe
              ? "Use the Scoring tab to submit any proposal — check some items and click Submit Proposal."
              : `Please wait while ${name} submits a proposal.`,
            buttonText: "OK",
          };
        }
        if (ph.startsWith("vote_")) {
          return {
            emoji: "🗳️",
            title: isMe ? "Vote NO on Your Proposal" : "Time to Vote!",
            message: isMe
              ? "Your proposal is up for a vote. Please go to the Proposal tab and vote NO on it to continue the demo."
              : `${name} submitted a proposal — go to the Proposal tab and vote on it!`,
            buttonText: "OK",
          };
        }
        return null;
    }
  };

  // ── show instruction modal when demoState changes (after welcome dismissed) ───
  const prevStateRef       = useRef(null);
  const hasShownFirstModal = useRef(false);

  useEffect(() => {
    if (!demoState || !welcomeDismissed || focalOrder.length === 0) return;

    // First time ready: show modal for current state
    if (!hasShownFirstModal.current) {
      hasShownFirstModal.current = true;
      prevStateRef.current = demoState;
      setInstructionModal(getPhaseModal(demoState));
      return;
    }

    // Subsequent state transitions
    if (prevStateRef.current !== demoState) {
      prevStateRef.current = demoState;
      setInstructionModal(getPhaseModal(demoState));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoState, welcomeDismissed, focalOrder.join(",")]);

  // ── complete: if modal already dismissed (e.g. page refresh), just submit ────
  useEffect(() => {
    if (demoState === "complete" && !instructionModal) {
      player.stage.set("submit", true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoState, instructionModal]);

  // ── DemoMaterialsPanel callbacks ─────────────────────────────────────────────

  const handleTabChange = (tab) => {
    if (demoState !== "intro") return;

    if (tab === "narrative" && !myViewedNarrative) {
      player.set("demo_viewedNarrative", true);
      setInstructionModal({
        emoji: "📖",
        title: "Narrative Viewed!",
        message: "Good! Now click the Scoring tab to see how proposals are scored.",
        buttonText: "OK",
      });
    } else if (tab === "calculator" && myViewedNarrative && !myViewedScoring) {
      player.set("demo_viewedScoring", true);
      setInstructionModal({
        emoji: "🧮",
        title: "Scoring Viewed!",
        message: "Great! The demo will continue automatically once everyone has finished reading.",
        buttonText: "OK",
      });
    }
  };

  const handleProposalSubmit = () => {
    // No explicit phase write needed — demoState advances automatically when
    // DemoMaterialsPanel appends the new proposal to demoProposalHistory.
  };

  // ── validation (fires BEFORE DemoMaterialsPanel writes to round state) ────────

  const validateProposal = (options) => {
    if (demoState === "final_propose" && isFirstFocal) {
      const allChecked = Object.keys(demoScoresheet).every(cat => options[cat] === 0);
      if (!allChecked) {
        return "For this step, please check ALL items in the Scoring tab, then submit.";
      }
    }
    return null;
  };

  const validateVote = (proposalId, vote) => {
    if (demoState && demoState.startsWith("vote_") && isFocalPlayer && vote === "accept") {
      return (
        "Normally you can of course vote yes on your own proposal — " +
        "for the demo only, please vote NO to continue."
      );
    }
    if (demoState === "final_vote" && vote === "reject") {
      return "Please vote YES to accept this proposal and continue the demo.";
    }
    return null;
  };

  const validateFinalizeVote = (_proposalId, decision) => {
    if (demoState === "final_finalize" && decision === "finalize") {
      return "Please click 'Keep Discussing' to continue the demo.";
    }
    return null;
  };

  // ── guardrail props passed down to DemoMaterialsPanel ────────────────────────

  let highlightTab         = null;
  let submitBlockedMessage = null;

  if (demoState === "intro") {
    if (!myViewedNarrative) {
      highlightTab         = "narrative";
      submitBlockedMessage = "Please read the Narrative tab first.";
    } else if (!myViewedScoring) {
      highlightTab         = "calculator";
      submitBlockedMessage = "Please read the Scoring tab next.";
    } else {
      submitBlockedMessage = "Waiting for other players to finish reading…";
    }
  } else if (demoState && demoState.startsWith("propose_") && !isFocalPlayer) {
    submitBlockedMessage = `Please wait — it's ${displayName(players.find(p => p.id === currentFocalId))}'s turn to submit.`;
  } else if (demoState === "final_propose" && !isFirstFocal) {
    submitBlockedMessage = `Please wait — ${displayName(players.find(p => p.id === focalOrder[0]))} will submit the final proposal.`;
  }

  // ── render ────────────────────────────────────────────────────────────────────

  if (!demoState) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading demo…</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex">
      {/* Left 70%: materials panel */}
      <div className="w-[70%]">
        <DemoMaterialsPanel
          roleName="Demo Role"
          roleNarrative={demoNarrative}
          roleScoresheet={demoScoresheet}
          roleBATNA={demoBATNA}
          roleRP={demoRP}
          highlightTab={highlightTab}
          submitBlockedMessage={submitBlockedMessage}
          validateProposal={validateProposal}
          validateVote={validateVote}
          validateFinalizeVote={validateFinalizeVote}
          onTabChange={handleTabChange}
          onProposalSubmit={handleProposalSubmit}
        />
      </div>

      {/* Right 30%: video chat */}
      <div className="w-[30%] fixed right-0 top-0 h-screen">
        <InteractionPanel profileComponent={profileComponent} />
      </div>

      {/* ── Welcome modal ─────────────────────────────────────────────────────── */}
      {!welcomeDismissed && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-lg w-full mx-4">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🤝</div>
              <h3 className="text-3xl font-bold text-blue-700 mb-4">
                 Before you Start: Demo
              </h3>
              <div className="text-left text-gray-700 leading-relaxed space-y-3">
                <p>
                  Practice using the negotiation interface together with your negotiating partners.
                </p>
                <p>
                  Take turns submitting and voting on proposals, learning how the system works before the real negotiation begins.
                </p>
                <p className="font-semibold text-blue-700">
                  Follow the on-screen instructions at each step.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                player.set("demo_welcomeDismissed", true);
                setWelcomeDismissed(true);
              }}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
            >
              Let's Go!
            </button>
          </div>
        </div>
      )}

      {/* ── Instruction modal (state transitions & per-player prompts) ───────────── */}
      {welcomeDismissed && instructionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-lg w-full mx-4">
            <div className="text-6xl mb-4 text-center">{instructionModal.emoji}</div>
            <h2 className="text-2xl font-bold mb-4 text-center">{instructionModal.title}</h2>
            <p className="text-lg text-gray-700 mb-6 text-center">{instructionModal.message}</p>
            <button
              onClick={() => {
                const cb = instructionModal.onClose;
                setInstructionModal(null);
                if (cb) cb();
              }}
              className="w-full bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 font-bold text-xl"
            >
              {instructionModal.buttonText}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
