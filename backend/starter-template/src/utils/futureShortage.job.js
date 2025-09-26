import Inventory from "../models/Inventory.js";
import { recomputeStockStatus, checkFutureShortages } from "../services/inventory.service.js";

let intervalHandle = null;

export async function checkAllInventoriesFutureShortages() {
  const inventories = await Inventory.find({});
  let totalAlerts = 0;
  for (const inv of inventories) {
    try {
      await recomputeStockStatus(inv);
      const alerts = await checkFutureShortages(inv);
      totalAlerts += alerts?.length || 0;
    } catch (e) {
      console.warn("[FUTURE_SHORTAGE_CHECK_ERROR]", inv?._id?.toString?.() || "n/a", e?.message || e);
    }
  }
  return { processed: inventories.length, alerts: totalAlerts };
}

export function startFutureShortageJob({ everyMs = 30 * 1000 } = {}) {
  if (intervalHandle) return intervalHandle;
  intervalHandle = setInterval(async () => {
    try {
      await checkAllInventoriesFutureShortages();
    } catch (e) {
      console.warn("[FUTURE_SHORTAGE_JOB_ERROR]", e?.message || e);
    }
  }, everyMs);
  console.log(`[FUTURE_SHORTAGE_JOB] started with interval ${everyMs / 1000}s`);
  return intervalHandle;
}

export function stopFutureShortageJob() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log("[FUTURE_SHORTAGE_JOB] stopped");
  }
}


