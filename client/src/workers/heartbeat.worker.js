let intervalId = null;

self.onmessage = (e) => {
  const { type, periodMs } = e.data || {};

  if (type === "start") {
    if (intervalId !== null) return;
    const period = typeof periodMs === "number" && periodMs > 0 ? periodMs : 5000;
    intervalId = setInterval(() => self.postMessage("tick"), period);
  } else if (type === "stop") {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }
};
