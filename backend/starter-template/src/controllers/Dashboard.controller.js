import mongoose from "mongoose";
import Inventory from "../models/Inventory.js";
import Patient from "../models/Patient.js";
import Match from "../models/Match.js";
import Appointment from "../models/Appointment.js";
import Hospital from "../models/Hospital.js";
import User from "../models/User.js";

function toDateOnlyString(d) {
  const iso = new Date(d).toISOString();
  return iso.slice(0, 10);
}

function startOfDayUTC(date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function endOfDayUTC(date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

function getAuthUserId(req) {
  return req.user?.id || req.user?._id || req.headers["x-user-id"] || req.query.userId || null;
}

// 1) Inventory summary
export const getInventorySummary = async (req, res, next) => {
  try {
    const { hospitalId } = req.params;
    const inventory = await Inventory.findOne({ hospital: hospitalId }).lean();
    const result = {
      blood: { totalAvailable: 0, byType: {} },
      organs: { totalAvailable: 0, byType: {} },
      expiring: { in24h: 0, in3d: 0, in7d: 0 },
      today: { used: 0, received: 0 }
    };

    if (!inventory) return res.json(result);

    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in3d = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    for (const item of inventory.items || []) {
      if (item.status === "AVAILABLE") {
        if (item.type === "BLOOD") {
          result.blood.totalAvailable += item.quantity;
          result.blood.byType[item.bloodType] = (result.blood.byType[item.bloodType] || 0) + item.quantity;
        } else if (item.type === "ORGAN") {
          result.organs.totalAvailable += item.quantity;
          result.organs.byType[item.organType] = (result.organs.byType[item.organType] || 0) + item.quantity;
        }
      }
      if (item.status === "AVAILABLE") {
        if (item.expiresAt <= in24h) result.expiring.in24h += 1;
        else if (item.expiresAt <= in3d) result.expiring.in3d += 1;
        else if (item.expiresAt <= in7d) result.expiring.in7d += 1;
      }
      if (toDateOnlyString(item.receivedAt) === toDateOnlyString(now)) {
        result.today.received += item.quantity;
      }
    }

    const todayKey = toDateOnlyString(now);
    for (const day of inventory.dailyUsage || []) {
      if (toDateOnlyString(day.date) === todayKey) {
        for (const u of day.itemsUsed || []) {
          result.today.used += u.quantity || 0;
        }
      }
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// 2) Available blood by type
export const getBloodAvailable = async (req, res, next) => {
  try {
    const { hospitalId } = req.params;
    const inv = await Inventory.findOne({ hospital: hospitalId }).lean();
    const byType = {};
    if (inv) {
      for (const item of inv.items || []) {
        if (item.type === "BLOOD" && item.status === "AVAILABLE") {
          byType[item.bloodType] = (byType[item.bloodType] || 0) + item.quantity;
        }
      }
    }
    res.json(byType);
  } catch (err) {
    next(err);
  }
};

// 3) Organ stock
export const getOrgansAvailable = async (req, res, next) => {
  try {
    const { hospitalId } = req.params;
    const inv = await Inventory.findOne({ hospital: hospitalId }).lean();
    const byType = {};
    if (inv) {
      for (const item of inv.items || []) {
        if (item.type === "ORGAN" && item.status === "AVAILABLE") {
          byType[item.organType] = (byType[item.organType] || 0) + item.quantity;
        }
      }
    }
    res.json(byType);
  } catch (err) {
    next(err);
  }
};

// 4) Expiry radar
export const getExpiring = async (req, res, next) => {
  try {
    const { hospitalId } = req.params;
    const days = Math.max(parseInt(req.query.days || "7"), 1);
    const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const inv = await Inventory.findOne({ hospital: hospitalId }).lean();
    let count = 0;
    const breakdownByType = {};
    if (inv) {
      for (const item of inv.items || []) {
        if (item.status === "AVAILABLE" && item.expiresAt <= cutoff) {
          count += 1;
          const key = item.type === "BLOOD" ? item.bloodType : item.organType;
          breakdownByType[key] = (breakdownByType[key] || 0) + 1;
        }
      }
    }
    res.json({ count, breakdownByType });
  } catch (err) {
    next(err);
  }
};

// 5) Daily usage series
export const getUsageSeries = async (req, res, next) => {
  try {
    const { hospitalId } = req.params;
    const from = req.query.from ? startOfDayUTC(req.query.from) : null;
    const to = req.query.to ? endOfDayUTC(req.query.to) : null;
    const inv = await Inventory.findOne({ hospital: hospitalId }).lean();
    const seriesMap = new Map();
    if (inv) {
      for (const d of inv.dailyUsage || []) {
        const day = startOfDayUTC(d.date);
        if ((from && day < from) || (to && day > to)) continue;
        let sum = 0;
        for (const u of d.itemsUsed || []) sum += u.quantity || 0;
        const key = toDateOnlyString(day);
        seriesMap.set(key, (seriesMap.get(key) || 0) + sum);
      }
    }
    const series = Array.from(seriesMap.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([date, used]) => ({ date, used }));
    res.json(series);
  } catch (err) {
    next(err);
  }
};

// 6) Log donation (add stock)
export const addInventoryItem = async (req, res, next) => {
  try {
    const { hospitalId } = req.params;
    const body = req.body || {};
    let inv = await Inventory.findOne({ hospital: hospitalId });
    if (!inv) {
      inv = await Inventory.create({ hospital: hospitalId, items: [] });
      await Hospital.findByIdAndUpdate(hospitalId, { inventory: inv._id });
    }
    inv.items.push({
      type: body.type,
      bloodType: body.bloodType,
      organType: body.organType,
      quantity: body.quantity,
      donatedBy: body.donatedBy || null,
      expiresAt: body.expiresAt,
      receivedAt: new Date(),
      status: "AVAILABLE"
    });
    await inv.save();
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// 7) Mark item used (decrement or set status)
export const markItemUsed = async (req, res, next) => {
  try {
    const { hospitalId, itemObjectId } = req.params;
    const { status, quantityUsed } = req.body || {};
    const inv = await Inventory.findOne({ hospital: hospitalId });
    if (!inv) return res.status(404).json({ error: "Inventory not found" });
    const idx = inv.items.findIndex(i => String(i._id) === String(itemObjectId));
    if (idx === -1) return res.status(404).json({ error: "Item not found" });
    const item = inv.items[idx];
    if (typeof quantityUsed === "number" && quantityUsed > 0) {
      const useQty = Math.min(quantityUsed, item.quantity);
      item.quantity -= useQty;
      if (item.quantity <= 0) {
        item.status = "USED";
        item.quantity = 0;
      }
      const todayKey = toDateOnlyString(new Date());
      let dayEntry = inv.dailyUsage.find(d => toDateOnlyString(d.date) === todayKey);
      if (!dayEntry) {
        inv.dailyUsage.push({ date: new Date(), itemsUsed: [{ itemIndex: idx, quantity: useQty }] });
      } else {
        dayEntry.itemsUsed.push({ itemIndex: idx, quantity: useQty });
      }
    } else if (status) {
      item.status = status;
    }
    await inv.save();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// 8) Overview
export const getHospitalOverview = async (req, res, next) => {
  try {
    const { hospitalId } = req.params;
    const pendingUnitsAgg = await Patient.aggregate([
      { $match: { hospitalId: new mongoose.Types.ObjectId(hospitalId), status: "PENDING" } },
      { $group: { _id: null, total: { $sum: "$unitsNeeded" } } }
    ]);
    const pendingUnits = pendingUnitsAgg[0]?.total || 0;

    const inv = await Inventory.findOne({ hospital: hospitalId }).lean();
    let availableUnits = 0;
    if (inv) {
      for (const item of inv.items || []) {
        if (item.type === "BLOOD" && item.status === "AVAILABLE") availableUnits += item.quantity;
      }
    }

    const patientIds = (await Patient.find({ hospitalId }, { _id: 1 }).lean()).map(p => p._id);
    const pendingMatches = await Match.countDocuments({ patientId: { $in: patientIds }, status: "PROPOSED" });
    const urgencyRatio = pendingUnits / Math.max(availableUnits, 1);
    res.json({ pendingUnits, availableUnits, urgencyRatio: Number(urgencyRatio.toFixed(2)), pendingMatches });
  } catch (err) {
    next(err);
  }
};

// 9) Active matches table
export const getHospitalMatches = async (req, res, next) => {
  try {
    const { hospitalId } = req.params;
    const { status = "PROPOSED", sort = "-createdAt", page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortField = sort.replace("-", "");
    const sortDir = sort.startsWith("-") ? -1 : 1;
    const patientIds = (await Patient.find({ hospitalId }, { _id: 1 }).lean()).map(p => p._id);

    const pipeline = [
      { $match: { patientId: { $in: patientIds }, status } },
      { $sort: { [sortField]: sortDir } },
      { $skip: skip },
      { $limit: parseInt(limit) },
      { $lookup: { from: "patients", localField: "patientId", foreignField: "_id", as: "patient" } },
      { $unwind: "$patient" },
      { $lookup: { from: "users", localField: "donorId", foreignField: "_id", as: "donor" } },
      { $unwind: "$donor" },
      {
        $project: {
          _id: 0,
          matchId: "$_id",
          status: 1,
          createdAt: 1,
          patient: { id: "$patient._id", name: "$patient.name", bloodType: "$patient.bloodType", unitsNeeded: "$patient.unitsNeeded" },
          donor: { id: "$donor._id", name: "$donor.name", isVerifiedDonor: "$donor.isVerifiedDonor" }
        }
      }
    ];

    const data = await Match.aggregate(pipeline);
    const total = await Match.countDocuments({ patientId: { $in: patientIds }, status });
    res.json({ data, page: parseInt(page), total });
  } catch (err) {
    next(err);
  }
};

// 10) Nearby donors
export const getDonorsNearby = async (req, res, next) => {
  try {
    const { hospitalId } = req.params;
    const { bloodType, verifiedOnly = "false", radiusKm = 25 } = req.query;
    const hospital = await Hospital.findById(hospitalId).lean();
    if (!hospital?.location) return res.json([]);
    const near = hospital.location.coordinates;
    const maxDistance = parseFloat(radiusKm) * 1000;
    const pipeline = [
      {
        $geoNear: {
          near: { type: "Point", coordinates: near },
          distanceField: "distance",
          maxDistance,
          spherical: true
        }
      },
      { $match: { availabilityStatus: "available", ...(bloodType ? { bloodType } : {}), ...(verifiedOnly === "true" ? { isVerifiedDonor: true } : {}) } },
      { $project: { _id: 1, name: 1, bloodType: 1, isVerifiedDonor: 1, lastDonationAt: 1, distanceKm: { $divide: ["$distance", 1000] } } },
      { $sort: { distanceKm: 1 } },
      { $limit: 100 }
    ];
    const donors = await User.aggregate(pipeline);
    res.json(donors.map(d => ({ id: d._id, name: d.name, bloodType: d.bloodType, isVerifiedDonor: d.isVerifiedDonor, distanceKm: Number(d.distanceKm.toFixed(2)), lastDonationAt: d.lastDonationAt })));
  } catch (err) {
    next(err);
  }
};

// 11) SOS create proposed matches
export const createSOSMatches = async (req, res, next) => {
  try {
    const { hospitalId } = req.params;
    const { bloodType, urgency, radiusKm = 25, limit = 5, patientId } = req.body || {};
    const hospital = await Hospital.findById(hospitalId).lean();
    if (!hospital?.location) return res.status(400).json({ error: "Hospital location missing" });
    const near = hospital.location.coordinates;
    const donors = await User.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: near },
          distanceField: "distance",
          maxDistance: parseFloat(radiusKm) * 1000,
          spherical: true
        }
      },
      { $match: { availabilityStatus: "available", bloodType, isVerifiedDonor: true } },
      { $sort: { distance: 1 } },
      { $limit: parseInt(limit) }
    ]);

    const patient = patientId ? await Patient.findById(patientId).lean() : await Patient.findOne({ hospitalId, status: "PENDING", bloodType }).lean();
    const targetPatientId = patient?._id;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const created = [];
    for (const d of donors) {
      const token = `tok_${new mongoose.Types.ObjectId().toString()}`;
      const doc = await Match.create({ patientId: targetPatientId, donorId: d._id, status: "PROPOSED", token, expiresAt });
      created.push({ matchId: doc._id, donorId: d._id, patientId: targetPatientId || null });
    }
    res.status(201).json({ created: created.length, matches: created });
  } catch (err) {
    next(err);
  }
};

// 12) Match → Appointment funnel
export const getFunnel = async (req, res, next) => {
  try {
    const { hospitalId } = req.params;
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;
    const patientIds = (await Patient.find({ hospitalId }, { _id: 1 }).lean()).map(p => p._id);

    const matchMatch = { patientId: { $in: patientIds } };
    const apptMatch = { hospitalId: new mongoose.Types.ObjectId(hospitalId) };
    if (from) { matchMatch.createdAt = { ...(matchMatch.createdAt || {}), $gte: from }; apptMatch.createdAt = { ...(apptMatch.createdAt || {}), $gte: from }; }
    if (to) { matchMatch.createdAt = { ...(matchMatch.createdAt || {}), $lte: to }; apptMatch.createdAt = { ...(apptMatch.createdAt || {}), $lte: to }; }

    const matchAgg = await Match.aggregate([
      { $match: matchMatch },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    const appointmentAgg = await Appointment.aggregate([
      { $match: apptMatch },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    const matches = {};
    for (const m of matchAgg) matches[m._id] = m.count;
    const appointments = {};
    for (const a of appointmentAgg) appointments[a._id] = a.count;
    res.json({ matches, appointments });
  } catch (err) {
    next(err);
  }
};

// 13) Me summary
export const getMeSummary = async (req, res, next) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    const donationsAgg = await Appointment.aggregate([
      { $match: { donorId: new mongoose.Types.ObjectId(userId), status: "COMPLETED" } },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);
    res.json({
      name: user.name,
      bloodType: user.bloodType,
      isVerifiedDonor: user.isVerifiedDonor,
      availabilityStatus: user.availabilityStatus,
      lastDonationAt: user.lastDonationAt,
      totals: { donations: donationsAgg[0]?.count || 0 }
    });
  } catch (err) {
    next(err);
  }
};

// 14) Toggle availability
export const toggleAvailability = async (req, res, next) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    const { availabilityStatus } = req.body || {};
    if (!["available", "unavailable"].includes(availabilityStatus)) return res.status(400).json({ error: "Invalid availabilityStatus" });
    const user = await User.findByIdAndUpdate(userId, { availabilityStatus }, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ ok: true, availabilityStatus: user.availabilityStatus });
  } catch (err) {
    next(err);
  }
};

// 15) Upcoming appointment
export const getUpcomingAppointment = async (req, res, next) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    const now = new Date();
    const appt = await Appointment.findOne({ donorId: userId, status: "SCHEDULED", dateTime: { $gt: now } })
      .sort({ dateTime: 1 })
      .lean();
    if (!appt) return res.json(null);
    const hospital = await Hospital.findById(appt.hospitalId).lean();
    res.json({ appointmentId: appt._id, dateTime: appt.dateTime, status: appt.status, hospital: { id: hospital?._id, name: hospital?.name } });
  } catch (err) {
    next(err);
  }
};

// 16) History
export const getAppointmentHistory = async (req, res, next) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;
    const match = { donorId: new mongoose.Types.ObjectId(userId), status: { $in: ["COMPLETED", "CANCELLED"] } };
    if (from) match.dateTime = { ...(match.dateTime || {}), $gte: from };
    if (to) match.dateTime = { ...(match.dateTime || {}), $lte: to };
    const appts = await Appointment.aggregate([
      { $match: match },
      { $lookup: { from: "hospitals", localField: "hospitalId", foreignField: "_id", as: "hospital" } },
      { $unwind: "$hospital" },
      { $project: { _id: 0, dateTime: 1, status: 1, hospital: { name: "$hospital.name" } } },
      { $sort: { dateTime: -1 } }
    ]);
    res.json(appts);
  } catch (err) {
    next(err);
  }
};

// 17) Requests near me
export const getNearbyRequests = async (req, res, next) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    const user = await User.findById(userId).lean();
    if (!user?.location?.coordinates) return res.json([]);
    const { radiusKm = 20 } = req.query;
    const hospitals = await Hospital.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: user.location.coordinates },
          distanceField: "distance",
          maxDistance: parseFloat(radiusKm) * 1000,
          spherical: true
        }
      },
      { $project: { _id: 1, name: 1, distanceKm: { $divide: ["$distance", 1000] } } }
    ]);
    const out = [];
    for (const h of hospitals) {
      const inv = await Inventory.findOne({ hospital: h._id }).lean();
      let availableUnits = 0;
      if (inv) {
        for (const item of inv.items || []) {
          if (item.type === "BLOOD" && item.bloodType === user.bloodType && item.status === "AVAILABLE") availableUnits += item.quantity;
        }
      }
      out.push({ hospitalId: h._id, hospitalName: h.name, distanceKm: Number(h.distanceKm.toFixed(2)), bloodType: user.bloodType, availableUnits, status: availableUnits <= 2 ? "CRITICAL" : availableUnits <= 5 ? "LOW" : "OK" });
    }
    res.json(out);
  } catch (err) {
    next(err);
  }
};

// Minimal writes
export const confirmMatch = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const doc = await Match.findByIdAndUpdate(matchId, { status: "CONFIRMED" }, { new: true });
    if (!doc) return res.status(404).json({ error: "Match not found" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

export const createAppointment = async (req, res, next) => {
  try {
    const { matchId, donorId, hospitalId, dateTime } = req.body || {};
    const appt = await Appointment.create({ matchId, donorId, hospitalId, dateTime, status: "SCHEDULED" });
    res.status(201).json({ appointmentId: appt._id });
  } catch (err) {
    next(err);
  }
};

export const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!["SCHEDULED", "COMPLETED", "CANCELLED"].includes(status)) return res.status(400).json({ error: "Invalid status" });
    const appt = await Appointment.findByIdAndUpdate(id, { status }, { new: true });
    if (!appt) return res.status(404).json({ error: "Appointment not found" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};


