import React from "react";
import { Users } from "lucide-react";

export function CustomLobby() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <Users className="w-20 h-20 text-gray-400" strokeWidth={1.5} />
        </div>

        {/* Main heading */}
        <h1 className="text-3xl font-semibold text-gray-900 mb-4">
          Waiting for other players
        </h1>

        {/* Subtext */}
        <p className="text-lg text-gray-500">
          Please wait for the game to be ready.
        </p>
      </div>
    </div>
  );
}
