import Inventory from "../models/Inventory.js";
import { recomputeStockStatus, checkCurrentShortages, checkFutureShortages } from "../services/inventory.service.js";

let intervalHandle = null;

export async function checkAllInventoriesShortages() {
  const inventories = await Inventory.find({});
  for (const inv of inventories) {
    try {
      await recomputeStockStatus(inv);
      await checkCurrentShortages(inv);
      await checkFutureShortages(inv);
    } catch (e) {
      console.warn("[SHORTAGE_CHECK_ERROR]", inv?._id?.toString?.() || "n/a", e?.message || e);
    }
  }
  return { processed: inventories.length };
}

export function startShortageJob({ everyMs = 30 * 1000 } = {}) {
  if (intervalHandle) return intervalHandle;
  intervalHandle = setInterval(async () => {
    try {
      await checkAllInventoriesShortages();
    } catch (e) {
      console.warn("[SHORTAGE_JOB_ERROR]", e?.message || e);
    }
  }, everyMs);
  console.log(`[SHORTAGE_JOB] started with interval ${everyMs / 1000}s`);
  return intervalHandle;
}

export function stopShortageJob() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log("[SHORTAGE_JOB] stopped");
  }
}


