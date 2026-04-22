import { useEffect, useContext } from "react";
import { usePlayer, useGame } from "@empirica/core/player/classic/react";
import { DailyCallContext } from "../App.jsx";

const HEARTBEAT_PERIOD_MS = 1000;

export function Heartbeat() {
  const player = usePlayer();
  const game = useGame();
  const dailyCtx = useContext(DailyCallContext);
  const callObject = dailyCtx?.callObject;

  const playerId = player?.id;
  const gameId = game?.id;

  useEffect(() => {
    if (!player || !gameId) return;

    const worker = new Worker(
      new URL("../workers/heartbeat.worker.js", import.meta.url),
      { type: "module" }
    );

    const writeHeartbeat = () => {
      let meetingState;
      let videoState;
      let audioState;
      try {
        meetingState = callObject?.meetingState?.();
        const local = callObject?.participants?.()?.local;
        videoState = local?.tracks?.video?.state;
        audioState = local?.tracks?.audio?.state;
      } catch (err) {
        // Daily not ready yet — write just the timestamp
      }

      player.set("lastSeen", {
        ts: Date.now(),
        meetingState,
        videoState,
        audioState,
      });
    };

    worker.onmessage = writeHeartbeat;
    worker.postMessage({ type: "start", periodMs: HEARTBEAT_PERIOD_MS });

    writeHeartbeat();

    return () => {
      worker.postMessage({ type: "stop" });
      worker.terminate();
    };
  }, [player, playerId, gameId, callObject]);

  return null;
}
