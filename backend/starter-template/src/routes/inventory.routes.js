import { Router } from "express";
import {
  getInventoryHandler,
  deleteInventoryHandler,
  addItemsHandler,
  useItemHandler,
  discardItemHandler,
  getStockHandler,
} from "../controllers/inventory.controller.js";

const router = Router();

// CRUD
router.get("/:inventoryId", getInventoryHandler);
router.delete("/:inventoryId", deleteInventoryHandler);

// Items
router.post("/:inventoryId/items", addItemsHandler);
router.post("/:inventoryId/items/:itemId/use", useItemHandler);
router.post("/:inventoryId/items/:itemId/discard", discardItemHandler);

// Stock summary
router.get("/:inventoryId/stock", getStockHandler);

export default router;


