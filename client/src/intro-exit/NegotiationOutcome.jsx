import React from "react";
import { usePlayer } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";

export function NegotiationOutcome({ next }) {
  const player = usePlayer();

  // Get bonus and agreement status from player data (set in onRoundEnded callback)
  const bonus = player.get("bonus") || 0;
  const reachedAgreement = bonus > 0;

  window.player = player;

  console.log("NegotiationOutcome Debug:", {
    bonus,
    reachedAgreement
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-8 md:p-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Negotiation Complete
          </h1>
          <div className="w-24 h-1 bg-indigo-600 mx-auto rounded-full"></div>
        </div>

        <div className="space-y-6">
          {reachedAgreement ? (
            <>
              <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg">
                <div className="flex items-center mb-4">
                  <div className="text-5xl mr-4">🎉</div>
                  <h2 className="text-2xl font-bold text-green-900">
                    Congratulations!
                  </h2>
                </div>
                <p className="text-lg text-gray-700">
                  Your group reached an agreement.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <p className="text-xl text-gray-700 mb-2">
                  Your score is:
                </p>
                <p className="text-5xl font-bold text-blue-600">
                  {bonus.toFixed(2)} points
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-lg">
                <div className="flex items-center mb-4">
                  <h2 className="text-2xl font-bold text-amber-900">
                    No Agreement Reached
                  </h2>
                </div>
                <p className="text-lg text-gray-700">
                  Sorry, your group did not reach agreement!
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <p className="text-lg text-gray-700">
                  You will receive the base payment only.
                </p>
              </div>
            </>
          )}

          <p className="text-center text-gray-600 pt-4">
            Please return to the classroom!
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          {/* <Button handleClick={next} autoFocus>
            <span className="text-lg px-4">Continue</span>
          </Button> */}
        </div>
      </div>
    </div>
  );
}
