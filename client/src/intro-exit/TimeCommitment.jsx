import React from "react";
import { Button } from "../components/Button.jsx";
import { useGame } from "@empirica/core/player/classic/react";

export function TimeCommitment({ next }) {
  const game = useGame();
  const treatment = game.get("treatment");
  const readRoleMin = Math.ceil(treatment.readRoleTime / 60);
  const negotiateMin = Math.ceil(treatment.negotiateTime / 60);
  const totalMin = Math.ceil((5 + readRoleMin + negotiateMin)/5)*5;
  const playerCount = treatment?.playerCount || 3;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-8 md:p-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Time Commitment
          </h1>
          <div className="w-24 h-1 bg-indigo-600 mx-auto rounded-full"></div>
        </div>

        <div className="space-y-6 text-gray-700">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-lg">
            <p className="text-base leading-relaxed">
              This task will require approximately <span className="font-semibold">{totalMin} minutes</span> of your time. 
              <br/><br/>In this activity, you will complete a collaborative decision-making process with <span className="font-semibold">{playerCount - 1} other {playerCount - 1 === 1 ? "participant" : "participants"}</span> <span style={{ color: "red", fontWeight: "bold" }}>on a video call</span>.
              <br/><br/>If you leave early, they will be unable to continue.
            </p>
          </div>

          <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-lg">
            <p className="text-base leading-relaxed font-semibold">
              Please do not continue unless you have time for the full activity.
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <Button
            handleClick={() => window.location.href = "https://ucl.ac.uk"}
            primary
          >
            <span className="text-lg px-4">Exit</span>
          </Button>
          <Button handleClick={next} autoFocus>
            <span className="text-lg px-4">Continue</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
