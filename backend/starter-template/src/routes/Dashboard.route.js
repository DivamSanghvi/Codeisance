import { Router } from "express";
import {
  getInventorySummary,
  getBloodAvailable,
  getOrgansAvailable,
  getExpiring,
  getUsageSeries,
  addInventoryItem,
  markItemUsed,
  getHospitalOverview,
  getHospitalMatches,
  getDonorsNearby,
  createSOSMatches,
  getFunnel,
  getMeSummary,
  toggleAvailability,
  getUpcomingAppointment,
  getAppointmentHistory,
  getNearbyRequests,
  confirmMatch,
  createAppointment,
  updateAppointmentStatus
} from "../controllers/Dashboard.controller.js";

const router = Router();

// DASHBOARD 1 — Hospital: Inventory (Operational)
router.get("/hospitals/:hospitalId/inventory/summary", getInventorySummary);
router.get("/hospitals/:hospitalId/inventory/blood-available", getBloodAvailable);
router.get("/hospitals/:hospitalId/inventory/organs-available", getOrgansAvailable);
router.get("/hospitals/:hospitalId/inventory/expiring", getExpiring);
router.get("/hospitals/:hospitalId/inventory/usage-series", getUsageSeries);
router.post("/hospitals/:hospitalId/inventory/items", addInventoryItem);
router.patch("/hospitals/:hospitalId/inventory/items/:itemObjectId", markItemUsed);

// DASHBOARD 2 — Hospital: Live Insights & Matching
router.get("/hospitals/:hospitalId/overview", getHospitalOverview);
router.get("/hospitals/:hospitalId/matches", getHospitalMatches);
router.get("/hospitals/:hospitalId/donors-nearby", getDonorsNearby);
router.post("/hospitals/:hospitalId/sos", createSOSMatches);
router.get("/hospitals/:hospitalId/funnel", getFunnel);

// DASHBOARD 3 — Donor
router.get("/me/summary", getMeSummary);
router.patch("/me/availability", toggleAvailability);
router.get("/me/appointments/upcoming", getUpcomingAppointment);
router.get("/me/appointments/history", getAppointmentHistory);
router.get("/me/nearby-requests", getNearbyRequests);

// Minimal writes for demo flows
router.patch("/matches/:matchId", confirmMatch);
router.post("/appointments", createAppointment);
router.patch("/appointments/:id", updateAppointmentStatus);

export default router;


