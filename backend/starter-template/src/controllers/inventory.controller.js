import {
  createInventory,
  getInventory,
  deleteInventory,
  addItems,
  useItem,
  discardItem,
  recomputeStockStatus,
} from "../services/inventory.service.js";

function ok(res, data, status = 200) {
  res.status(status).json({ success: true, data });
}

function fail(res, err) {
  const status = err.status || 500;
  res.status(status).json({ success: false, error: err.message || "Internal Error" });
}

export async function createInventoryHandler(req, res) {
  try {
    const { hospitalId } = req.body || {};
    const inv = await createInventory(hospitalId);
    ok(res, inv, 201);
  } catch (e) {
    fail(res, e);
  }
}

export async function getInventoryHandler(req, res) {
  try {
    const inv = await getInventory(req.params.inventoryId);
    ok(res, inv);
  } catch (e) {
    fail(res, e);
  }
}

export async function deleteInventoryHandler(req, res) {
  try {
    const result = await deleteInventory(req.params.inventoryId);
    ok(res, result);
  } catch (e) {
    fail(res, e);
  }
}

export async function addItemsHandler(req, res) {
  try {
    const items = req.body?.items || [];
    const inv = await addItems(req.params.inventoryId, items);
    ok(res, inv);
  } catch (e) {
    fail(res, e);
  }
}

export async function useItemHandler(req, res) {
  try {
    const { quantity, patientId } = req.body || {};
    const inv = await useItem(req.params.inventoryId, req.params.itemId, quantity, patientId);
    ok(res, inv);
  } catch (e) {
    fail(res, e);
  }
}

export async function discardItemHandler(req, res) {
  try {
    const { reason } = req.body || {};
    const inv = await discardItem(req.params.inventoryId, req.params.itemId, reason);
    ok(res, inv);
  } catch (e) {
    fail(res, e);
  }
}

export async function getStockHandler(req, res) {
  try {
    const inv = await getInventory(req.params.inventoryId);
    await recomputeStockStatus(inv);
    ok(res, { stockStatus: inv.stockStatus });
  } catch (e) {
    fail(res, e);
  }
}


