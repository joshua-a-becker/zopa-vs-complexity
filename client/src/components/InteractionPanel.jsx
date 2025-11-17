import React from "react";
import { VideoChat } from "./VideoChat";
import { CustomChat } from "./CustomChat";

export function InteractionPanel({ profileComponent }) {
  return (
    <div className="w-[45%] flex flex-col bg-blue-50 border-l-0 border-gray-400">
      {/* Profile bar spans left side only */}
      {profileComponent}

      {/* Video and Chat row */}
      <div className="flex-1 flex overflow-hidden pl-0 pr-2 py-2 gap-0">
        {/* Video takes up slightly over half of left side */}
        <div className="w-[45%] overflow-hidden">
          <VideoChat />
        </div>
        {/* Chat takes up remaining space - floating white box on blue background */}
        <div className="w-[55%] bg-white rounded-lg shadow-md border border-blue-200 overflow-hidden">
          <CustomChat />
        </div>
      </div>
    </div>
  );
}
