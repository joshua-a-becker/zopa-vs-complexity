import React from "react";
import { usePlayer, useGame } from "@empirica/core/player/classic/react";

export function ReadRole() {
  const player = usePlayer();
  const game = useGame();

  return (
    <div className="w-full h-full p-6">
      <h1 className="text-2xl font-bold mb-4">Read Your Negotiation Role</h1>
      {/* Add role reading content here */}
    </div>
  );
}
