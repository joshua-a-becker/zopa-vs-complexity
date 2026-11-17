import React, { useState, useEffect, useContext } from "react";
import { Button } from "../components/Button.jsx";
import { MediaPermissionGate } from "../components/MediaPermissionGate.jsx";
import { DailyCallContext } from "../App.jsx";
import { stopAllTrackedStreams } from "../mediaTracks";

import { usePlayer } from "@empirica/core/player/classic/react";

export function DisplayNameEntry({ next }) {
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const { setMediaStream } = useContext(DailyCallContext);

  const player = usePlayer();

  const urlParams = new URLSearchParams(window.location.search);

  // Extract all URL parameters except participantKey
  for (const [key, value] of urlParams.entries()) {
    if (key !== "participantKey") {
      player.set(key, value);
      console.log("setting " + key + " : " + value)
    }
  }


  // Get stored device IDs if they exist (for page refresh)
  const storedVideoDeviceId = player?.get("videoDeviceId");
  const storedAudioDeviceId = player?.get("audioDeviceId");

  console.log("student ID: " + player.get("studentId"))

  const handleSubmit = () => {
    if (!displayName.trim()) {
      setError("Please enter a display name");
      return;
    }

    if (displayName.trim().length < 2) {
      setError("Display name must be at least 2 characters");
      return;
    }

    if (displayName.trim().length > 20) {
      setError("Display name must be 20 characters or less");
      return;
    }

    // Save display name to player data
    player.set("displayName", displayName.trim());
    next();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  // Handle permissions granted with device IDs
  const handlePermissionsGranted = (stream, videoDeviceId, audioDeviceId, audioEnabled, videoEnabled) => {
    // Store device IDs in player data for later use
    if (videoDeviceId) {
      player.set("videoDeviceId", videoDeviceId);
    }
    if (audioDeviceId) {
      player.set("audioDeviceId", audioDeviceId);
    }

    // Persist the mic/camera choice from the gate so it carries into the
    // negotiation. Honor an explicit choice; otherwise seed a default only when
    // unset (never clobbering a prior choice). Same history format as VideoChat.
    if (audioEnabled !== undefined) {
      player.set("audioEnabled", audioEnabled);
      player.set("audioHistory", [[audioEnabled ? "on" : "off", Date.now()]]);
    } else if (player.get("audioEnabled") === undefined) {
      player.set("audioEnabled", true);
      player.set("audioHistory", [["on", Date.now()]]);
    }
    if (videoEnabled !== undefined) {
      player.set("videoEnabled", videoEnabled);
      player.set("videoHistory", [[videoEnabled ? "on" : "off", Date.now()]]);
    } else if (player.get("videoEnabled") === undefined) {
      player.set("videoEnabled", true);
      player.set("videoHistory", [["on", Date.now()]]);
    }

    // The gate only checks that capture works. Nothing uses the camera/mic
    // until the negotiation stage, so release it now: the browser recording
    // indicator goes dark. VideoChat re-acquires the same devices (stored
    // above) once the player clicks "Let's Go!".
    stopAllTrackedStreams();
    setMediaStream(null);
  };

  return (
    <MediaPermissionGate
      onPermissionsGranted={handlePermissionsGranted}
      storedVideoDeviceId={storedVideoDeviceId}
      storedAudioDeviceId={storedAudioDeviceId}
      storedAudioEnabled={player?.get("audioEnabled")}
      storedVideoEnabled={player?.get("videoEnabled")}
    >
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">👋</div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 tracking-wide uppercase">
              Choose a Display Name
            </h1>
            <div className="w-24 h-1 bg-indigo-600 mx-auto rounded-full"></div>
          </div>

          <p className="text-lg leading-relaxed text-gray-800 text-center mb-8">
            This name will be shown to the other players during the video call.
            Your first name works well.
          </p>

          <div>
            <label htmlFor="displayName" className="block text-sm font-semibold text-gray-700 mb-2">
              Display name
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setError(""); // Clear error when user types
              }}
              onKeyPress={handleKeyPress}
              placeholder="e.g. Alex"
              className={`w-full px-4 py-3 text-lg border-2 rounded-lg focus:outline-none focus:ring-4 transition-colors ${
                error
                  ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                  : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-100"
              }`}
              maxLength={20}
              autoFocus
            />
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-red-600">{error}</span>
              <span className="text-gray-400 tabular-nums">{displayName.length}/20</span>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button handleClick={handleSubmit}>
              <span className="text-lg px-4">Continue</span>
            </Button>
          </div>
        </div>
      </div>
    </MediaPermissionGate>
  );
}