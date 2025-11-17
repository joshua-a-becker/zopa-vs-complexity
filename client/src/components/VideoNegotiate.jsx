import React from "react";
import { usePlayer } from "@empirica/core/player/classic/react";
import { InteractionPanel } from "./InteractionPanel";
import { MaterialsPanel } from "./MaterialsPanel";

export function VideoNegotiate({ profileComponent }) {
  const player = usePlayer();
  const roleName = player.get("roleName");
  const roleNarrative = player.get("roleNarrative");
  const roleScoresheet = player.get("roleScoresheet");
  const roleBATNA = player.get("roleBATNA");
  const roleRP = player.get("roleRP");

  if (!roleName || !roleNarrative || !roleScoresheet) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-gray-500">Loading your role...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex">
      <MaterialsPanel
        roleName={roleName}
        roleNarrative={roleNarrative}
        roleScoresheet={roleScoresheet}
        roleBATNA={roleBATNA}
        roleRP={roleRP}
      />
      <InteractionPanel profileComponent={profileComponent} />
    </div>
  );
}
