import React from "react";
import { Users } from "lucide-react";
import rolesData from "../../../server/src/roles.json";

export function CustomLobby() {

  return (
    <div className="min-h-screen w-screen bg-gray-100">
      <div className="grid grid-cols-[400px_1fr] gap-8 max-w-7xl mx-auto">
        {/* Left column - Waiting message (fixed) */}
        <div className="sticky top-0 h-screen flex items-center justify-center">
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
              Please wait up to 5 minutes for other participants.
            </p><br/>
            <p>
              If we can't assign you to a group within 5 minutes, we'll pay you $1.00 for your time.
            </p>
          </div>
        </div>

        {/* Right column - Content that scrolls with page */}
        <div className="py-12 px-8">
          <div className="h-[10vh]"></div> {/* Spacer to push content down 1/3 of viewport */}
          <div className="bg-white rounded-lg shadow-lg p-12 mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">While You Wait. . .</h2>

          <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: rolesData.tips }} />
          </div>
        </div>
      </div>
    </div>
  );
}
