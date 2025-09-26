import { markExpiredItems } from "../services/inventory.service.js";

let intervalHandle = null;

export function startExpiryJob({ everyMs = 60 * 60 * 1000 } = {}) {
  if (intervalHandle) return intervalHandle;
  intervalHandle = setInterval(async () => {
    try {
      await markExpiredItems();
    } catch (e) {
      console.warn("[EXPIRY_JOB_ERROR]", e?.message || e);
    }
  }, everyMs);
  console.log(`[EXPIRY_JOB] started with interval ${everyMs / 1000}s`);
  return intervalHandle;
}

export function stopExpiryJob() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log("[EXPIRY_JOB] stopped");
  }
}


