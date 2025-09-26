import dotenv from "dotenv";
import mongoose from "mongoose";
import Inventory from "../models/Inventory.js";
import Hospital from "../models/Hospital.js";
import { BLOOD_TYPES, ORGAN_TYPES, getBloodThresholds, getOrganThreshold, getFutureShortageDays, getFutureShortageLookbackDays } from "../utils/thresholds.js";
import { emitWebhook } from "../utils/webhook.js";

dotenv.config();

const WEBHOOK_URL_SHORTAGE = process.env.WEBHOOK_URL_SHORTAGE;
const WEBHOOK_URL_FUTURE_SHORTAGE = process.env.WEBHOOK_URL_FUTURE_SHORTAGE;
const WEBHOOK_URL_EXPIRED = process.env.WEBHOOK_URL_EXPIRED;

function assertObjectId(id, name = "id") {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error(`${name} is not a valid ObjectId`);
    err.status = 400;
    throw err;
  }
}

function normalizeDateToUTC(date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function validateItemShape(item) {
  if (!item || !item.type) {
    throw Object.assign(new Error("Item type is required"), { status: 400 });
  }
  if (!["BLOOD", "ORGAN"].includes(item.type)) {
    throw Object.assign(new Error("Invalid item type"), { status: 400 });
  }
  if (item.type === "BLOOD") {
    if (!item.bloodType || !BLOOD_TYPES.includes(item.bloodType)) {
      throw Object.assign(new Error("bloodType is required and must be valid for BLOOD"), { status: 400 });
    }
    if (item.organType != null) {
      throw Object.assign(new Error("organType must be null/undefined for BLOOD"), { status: 400 });
    }
  }
  if (item.type === "ORGAN") {
    if (!item.organType || !ORGAN_TYPES.includes(item.organType)) {
      throw Object.assign(new Error("organType is required and must be valid for ORGAN"), { status: 400 });
    }
    if (item.bloodType != null) {
      throw Object.assign(new Error("bloodType must be null/undefined for ORGAN"), { status: 400 });
    }
  }
  if (item.quantity == null || Number(item.quantity) < 1) {
    throw Object.assign(new Error("quantity must be >= 1"), { status: 400 });
  }
  if (!item.expiresAt) {
    throw Object.assign(new Error("expiresAt is required"), { status: 400 });
  }
}

export async function createInventory(hospitalId) {
  assertObjectId(hospitalId, "hospitalId");
  const hospital = await Hospital.findById(hospitalId);
  if (!hospital) {
    const err = new Error("Hospital not found");
    err.status = 404;
    throw err;
  }
  if (hospital.inventory) {
    const err = new Error("Inventory already exists for this hospital");
    err.status = 400;
    throw err;
  }
  const inventory = await Inventory.create({ hospital: hospital._id, items: [], dailyUsage: [], stockStatus: [] });
  hospital.inventory = inventory._id;
  await hospital.save();
  return inventory;
}

export async function getInventory(id) {
  assertObjectId(id, "inventoryId");
  const inv = await Inventory.findById(id).populate({ path: "hospital", select: "name type licenseNo address.city" });
  if (!inv) {
    const err = new Error("Inventory not found");
    err.status = 404;
    throw err;
  }
  return inv;
}

export async function deleteInventory(id) {
  assertObjectId(id, "inventoryId");
  const inv = await Inventory.findById(id);
  if (!inv) {
    const err = new Error("Inventory not found");
    err.status = 404;
    throw err;
  }
  const hospital = await Hospital.findById(inv.hospital);
  if (hospital) {
    hospital.inventory = undefined;
    await hospital.save();
  }
  await Inventory.deleteOne({ _id: id });
  return { deleted: true };
}

export async function recomputeStockStatus(inventory) {
  const items = inventory.items || [];
  const map = new Map();
  for (const it of items) {
    if (it.status !== "AVAILABLE") continue;
    if (it.type === "BLOOD") {
      const key = `BLOOD|${it.bloodType}`;
      const curr = map.get(key) || { type: "BLOOD", bloodType: it.bloodType, availableQuantity: 0 };
      curr.availableQuantity += Number(it.quantity || 0);
      map.set(key, curr);
    } else if (it.type === "ORGAN") {
      const key = `ORGAN|${it.organType}`;
      const curr = map.get(key) || { type: "ORGAN", organType: it.organType, availableQuantity: 0 };
      curr.availableQuantity += Number(it.quantity || 0);
      map.set(key, curr);
    }
  }
  inventory.stockStatus = Array.from(map.values());
  await inventory.save();
  return inventory.stockStatus;
}

export async function addItems(inventoryId, items) {
  assertObjectId(inventoryId, "inventoryId");
  const inv = await Inventory.findById(inventoryId);
  if (!inv) {
    const err = new Error("Inventory not found");
    err.status = 404;
    throw err;
  }
  if (!Array.isArray(items) || items.length === 0) {
    const err = new Error("items array is required");
    err.status = 400;
    throw err;
  }
  for (const item of items) {
    validateItemShape(item);
    inv.items.push({
      type: item.type,
      bloodType: item.type === "BLOOD" ? item.bloodType : undefined,
      organType: item.type === "ORGAN" ? item.organType : undefined,
      quantity: Number(item.quantity),
      donatedBy: item.donatedBy,
      receivedAt: item.receivedAt ? new Date(item.receivedAt) : new Date(),
      expiresAt: new Date(item.expiresAt),
      status: "AVAILABLE",
    });
  }
  await recomputeStockStatus(inv);
  await runShortageChecks(inv);
  return await Inventory.findById(inv._id);
}

export async function appendDailyUsage(inventory, usage) {
  const today = normalizeDateToUTC(new Date());
  const existing = (inventory.dailyUsage || []).find((d) => normalizeDateToUTC(d.date).getTime() === today.getTime());
  if (existing) {
    existing.itemsUsed.push(usage);
  } else {
    inventory.dailyUsage.push({ date: today, itemsUsed: [usage] });
  }
  await inventory.save();
  return inventory.dailyUsage;
}

export async function useItem(inventoryId, itemId, quantity, patientId) {
  assertObjectId(inventoryId, "inventoryId");
  assertObjectId(itemId, "itemId");
  const q = Number(quantity);
  if (!q || q < 1) {
    const err = new Error("quantity must be >= 1");
    err.status = 400;
    throw err;
  }
  const inv = await Inventory.findById(inventoryId);
  if (!inv) {
    const err = new Error("Inventory not found");
    err.status = 404;
    throw err;
  }
  const idx = inv.items.findIndex((i) => String(i._id) === String(itemId));
  if (idx === -1) {
    const err = new Error("Item not found");
    err.status = 404;
    throw err;
  }
  const item = inv.items[idx];
  if (item.status !== "AVAILABLE") {
    const err = new Error("Item is not AVAILABLE");
    err.status = 400;
    throw err;
  }
  if (new Date(item.expiresAt) <= new Date()) {
    const err = new Error("Item expired");
    err.status = 400;
    throw err;
  }
  const decrement = Math.min(q, item.quantity);
  item.quantity -= decrement;
  if (patientId && mongoose.Types.ObjectId.isValid(patientId)) {
    item.patient = patientId;
  }
  if (item.quantity === 0) {
    item.status = "USED";
  }
  await inv.save();
  await appendDailyUsage(inv, { itemIndex: idx, quantity: decrement });
  await recomputeStockStatus(inv);
  await runShortageChecks(inv);
  return await Inventory.findById(inv._id);
}

export async function discardItem(inventoryId, itemId, reason) {
  assertObjectId(inventoryId, "inventoryId");
  assertObjectId(itemId, "itemId");
  const inv = await Inventory.findById(inventoryId);
  if (!inv) {
    const err = new Error("Inventory not found");
    err.status = 404;
    throw err;
  }
  const item = inv.items.find((i) => String(i._id) === String(itemId));
  if (!item) {
    const err = new Error("Item not found");
    err.status = 404;
    throw err;
  }
  item.status = "EXPIRED";
  await inv.save();
  await recomputeStockStatus(inv);
  await runShortageChecks(inv);
  console.log(`[DISCARD] inventory=${inv._id} itemId=${item._id} reason=${reason || "OTHER"}`);
  return await Inventory.findById(inv._id);
}

export async function checkCurrentShortages(inventory) {
  const bloodThresholds = getBloodThresholds();
  const organThreshold = getOrganThreshold();
  const alerts = [];

  // Build availability maps from stockStatus
  const bloodAvail = new Map();
  const organAvail = new Map();
  for (const status of inventory.stockStatus || []) {
    if (status.type === "BLOOD") {
      bloodAvail.set(status.bloodType, Number(status.availableQuantity || 0));
    } else if (status.type === "ORGAN") {
      organAvail.set(status.organType, Number(status.availableQuantity || 0));
    }
  }

  // Evaluate BLOOD shortages for all types (missing => 0)
  for (const bt of BLOOD_TYPES) {
    const available = Number(bloodAvail.get(bt) || 0);
    const threshold = Number(bloodThresholds[bt] ?? 3);
    if (available < threshold) {
      const payload = {
        hospital: String(inventory.hospital),
        type: "BLOOD",
        bloodType: bt,
        available,
        threshold,
      };
      console.log(`[SHORTAGE] hospital=${payload.hospital} type=BLOOD bloodType=${payload.bloodType} available=${payload.available} threshold=${payload.threshold}`);
      alerts.push(payload);
      await emitWebhook(WEBHOOK_URL_SHORTAGE, "SHORTAGE", payload);
    }
  }

  // Evaluate ORGAN shortages for all types (missing => 0)
  for (const ot of ORGAN_TYPES) {
    const available = Number(organAvail.get(ot) || 0);
    const threshold = Number(organThreshold);
    if (available < threshold) {
      const payload = {
        hospital: String(inventory.hospital),
        type: "ORGAN",
        organType: ot,
        available,
        threshold,
      };
      console.log(`[SHORTAGE] hospital=${payload.hospital} type=ORGAN organType=${payload.organType} available=${payload.available} threshold=${payload.threshold}`);
      alerts.push(payload);
      await emitWebhook(WEBHOOK_URL_SHORTAGE, "SHORTAGE", payload);
    }
  }

  return alerts;
}

function computeAverageDailyUsage(inventory, filterFn) {
  const lookback = getFutureShortageLookbackDays();
  const cutoff = normalizeDateToUTC(new Date(Date.now() - lookback * 24 * 60 * 60 * 1000));
  const totalsByDay = new Map();
  for (const day of inventory.dailyUsage || []) {
    const dateKey = normalizeDateToUTC(day.date);
    if (dateKey < cutoff) continue;
    let dayTotal = 0;
    for (const entry of day.itemsUsed || []) {
      const item = inventory.items?.[entry.itemIndex];
      if (!item) continue;
      if (!filterFn(item)) continue;
      dayTotal += Number(entry.quantity || 0);
    }
    const prev = totalsByDay.get(dateKey.getTime()) || 0;
    totalsByDay.set(dateKey.getTime(), prev + dayTotal);
  }
  if (totalsByDay.size === 0) return 0;
  const sum = Array.from(totalsByDay.values()).reduce((a, b) => a + b, 0);
  return sum / totalsByDay.size;
}

export async function checkFutureShortages(inventory) {
  const daysThreshold = getFutureShortageDays();
  const alerts = [];
  // Blood types
  for (const bt of BLOOD_TYPES) {
    const available = Number(inventory.stockStatus?.find((s) => s.type === "BLOOD" && s.bloodType === bt)?.availableQuantity || 0);
    const avgDailyUsage = computeAverageDailyUsage(inventory, (i) => i.type === "BLOOD" && i.bloodType === bt);
    const daysOfStock = avgDailyUsage > 0 ? available / avgDailyUsage : Infinity;
    if (avgDailyUsage > 0 && daysOfStock < daysThreshold) {
      const payload = {
        hospital: String(inventory.hospital),
        type: "BLOOD",
        bloodType: bt,
        daysOfStock: Number(daysOfStock.toFixed(2)),
        avgDailyUsage: Number(avgDailyUsage.toFixed(2)),
        available,
      };
      console.log(`[FUTURE_SHORTAGE] hospital=${payload.hospital} type=BLOOD bloodType=${payload.bloodType} daysOfStock=${payload.daysOfStock} avgDailyUsage=${payload.avgDailyUsage} available=${payload.available}`);
      alerts.push(payload);
      await emitWebhook(WEBHOOK_URL_FUTURE_SHORTAGE, "FUTURE_SHORTAGE", payload);
    }
  }
  // Organ types
  for (const ot of ORGAN_TYPES) {
    const available = Number(inventory.stockStatus?.find((s) => s.type === "ORGAN" && s.organType === ot)?.availableQuantity || 0);
    const avgDailyUsage = computeAverageDailyUsage(inventory, (i) => i.type === "ORGAN" && i.organType === ot);
    const daysOfStock = avgDailyUsage > 0 ? available / avgDailyUsage : Infinity;
    if (avgDailyUsage > 0 && daysOfStock < daysThreshold) {
      const payload = {
        hospital: String(inventory.hospital),
        type: "ORGAN",
        organType: ot,
        daysOfStock: Number(daysOfStock.toFixed(2)),
        avgDailyUsage: Number(avgDailyUsage.toFixed(2)),
        available,
      };
      console.log(`[FUTURE_SHORTAGE] hospital=${payload.hospital} type=ORGAN organType=${payload.organType} daysOfStock=${payload.daysOfStock} avgDailyUsage=${payload.avgDailyUsage} available=${payload.available}`);
      alerts.push(payload);
      await emitWebhook(WEBHOOK_URL_FUTURE_SHORTAGE, "FUTURE_SHORTAGE", payload);
    }
  }
  return alerts;
}

async function runShortageChecks(inv) {
  await checkCurrentShortages(inv);
  await checkFutureShortages(inv);
}

export async function markExpiredItems() {
  const now = new Date();
  const inventories = await Inventory.find({ "items.expiresAt": { $lte: now }, "items.status": { $ne: "EXPIRED" } });
  for (const inv of inventories) {
    let changed = false;
    for (const item of inv.items) {
      if (item.status !== "EXPIRED" && new Date(item.expiresAt) <= now) {
        item.status = "EXPIRED";
        changed = true;
        const payload = {
          inventory: String(inv._id),
          itemId: String(item._id),
          type: item.type,
          bloodType: item.bloodType,
          organType: item.organType,
          expiredAt: item.expiresAt,
        };
        console.log(`[ITEM_EXPIRED] inventory=${payload.inventory} itemId=${payload.itemId} type=${payload.type} ${payload.bloodType ? `bloodType=${payload.bloodType}` : ""} ${payload.organType ? `organType=${payload.organType}` : ""} expiredAt=${payload.expiredAt}`);
        await emitWebhook(WEBHOOK_URL_EXPIRED, "ITEM_EXPIRED", payload);
      }
    }
    if (changed) {
      await inv.save();
      await recomputeStockStatus(inv);
      await runShortageChecks(inv);
    }
  }
  return { processed: inventories.length };
}


