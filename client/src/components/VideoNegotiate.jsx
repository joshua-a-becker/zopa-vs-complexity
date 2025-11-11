import React from "react";
import { usePlayer, useGame } from "@empirica/core/player/classic/react";
import { VideoChat } from "./VideoChat";
import { Chat } from "@empirica/core/player/classic/react";

export function VideoNegotiate() {
  const player = usePlayer();
  const game = useGame();

  return (
    <div className="w-full h-full flex">
      <div className="flex-1">
        <VideoChat />
      </div>
      <div className="w-96 border-l border-gray-300">
        <Chat scope={game} attribute="chat" />
      </div>
    </div>
  );
}
