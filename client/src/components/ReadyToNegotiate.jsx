import React, { useState, useEffect } from "react";
import { usePlayer } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";

export function ReadyToNegotiate({ profileComponent }) {
  const player = usePlayer();
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    // Start countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          player.stage.set("submit", true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [player]);

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
              {countdown}
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
