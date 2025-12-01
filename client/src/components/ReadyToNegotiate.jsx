import React from "react";
import { useStageTimer } from "@empirica/core/player/classic/react";

export function ReadyToNegotiate({ profileComponent }) {
  const timer = useStageTimer();
  const remaining = timer?.remaining ? Math.round(timer.remaining / 1000) : 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-8 md:p-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Ready to Negotiate!
          </h1>
          <div className="w-24 h-1 bg-indigo-600 mx-auto rounded-full"></div>
        </div>

        <div className="space-y-6 text-gray-700">
          <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg">
            <p className="text-xl leading-relaxed text-center">
              Now that you have reviewed your role, it's time to negotiate!
            </p>
          </div>

          <div className="text-center">
            <p className="text-lg text-gray-600 mb-2">
              You will be automatically redirected to the video call in
            </p>
            <div className="text-6xl font-bold text-indigo-600 my-4">
              {remaining}
            </div>
            <p className="text-lg text-gray-600">
              seconds
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
