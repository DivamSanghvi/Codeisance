import crypto from 'crypto';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import Match from '../models/Match.js';
import Appointment from '../models/Appointment.js';
import { isCompatible } from '../utils/bloodCompatibility.js';

// Create patient and initiate matching
export const createPatient = async (req, res, next) => {
  try {
    const { hospitalId, name, bloodType, unitsNeeded } = req.body;
    console.log('Creating patient:', req.body);

    // Validate required fields
    if (!hospitalId || !name || !bloodType || !unitsNeeded) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: hospitalId, name, bloodType, unitsNeeded'
      });
    }

    // Save patient
    const patient = new Patient({ hospitalId, name, bloodType, unitsNeeded });
    await patient.save();
    console.log('Patient created:', patient._id);

    // For now, skip inventory, directly find donors
    const deficit = unitsNeeded; // Assume no inventory

    if (deficit > 0) {
      await findAndProposeDonors(patient, deficit);
    }

    res.status(201).json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error('Error creating patient:', error.message);
    next(error);
  }
};

// Find and propose donors
const findAndProposeDonors = async (patient, targetUnits) => {
  try {
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Get hospital location for geo query
    const Hospital = (await import('../models/Hospital.js')).default;
    const hospital = await Hospital.findById(patient.hospitalId);
    if (!hospital) return;

    const pipeline = [
      {
        $geoNear: {
          near: { type: 'Point', coordinates: hospital.location.coordinates },
          distanceField: 'distance',
          maxDistance: 10000, // 10 km
          spherical: true
        }
      },
      {
        $match: {
          bloodType: { $in: Object.keys(require('../utils/bloodCompatibility.js').compatibilityMap).filter(dt => isCompatible(dt, patient.bloodType)) },
          isVerifiedDonor: true,
          $or: [
            { lastDonationAt: { $lte: ninetyDaysAgo } },
            { lastDonationAt: null }
          ],
          $or: [
            { lastPingedAt: { $lte: fourteenDaysAgo } },
            { lastPingedAt: null }
          ]
        }
      },
      {
        $addFields: {
          random: { $rand: {} }
        }
      },
      {
        $sort: {
          distance: 1,
          lastDonationAt: 1, // oldest first
          random: 1
        }
      },
      {
        $limit: 30
      }
    ];

    const donors = await User.aggregate(pipeline);

    // Create proposals
    for (const donor of donors.slice(0, targetUnits)) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

      const match = new Match({
        patientId: patient._id,
        donorId: donor._id,
        token,
        expiresAt
      });
      await match.save();

      // Update donor lastPingedAt
      await User.findByIdAndUpdate(donor._id, { lastPingedAt: now });

      // Mock send SMS
      console.log(`Sending SMS to donor ${donor.phone}: Confirm donation at /confirm/${token}`);
    }

    console.log(`Proposed ${Math.min(donors.length, targetUnits)} donors for patient ${patient._id}`);
  } catch (error) {
    console.error('Error finding donors:', error.message);
  }
};

// Confirm match
export const confirmMatch = async (req, res, next) => {
  try {
    const { token } = req.params;
    console.log('Confirming match with token:', token);

    const match = await Match.findOne({ token, status: 'PROPOSED' });
    if (!match || match.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Update match to CONFIRMED
    match.status = 'CONFIRMED';
    await match.save();

    // Create appointment (next available slot, e.g., tomorrow 10 AM)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const appointment = new Appointment({
      matchId: match._id,
      donorId: match.donorId,
      hospitalId: (await Patient.findById(match.patientId)).hospitalId,
      dateTime: tomorrow
    });
    await appointment.save();

    // Update patient confirmedCount
    await Patient.findByIdAndUpdate(match.patientId, { $inc: { confirmedCount: 1 } });

    res.json({
      success: true,
      message: 'Donation confirmed',
      appointment
    });
  } catch (error) {
    console.error('Error confirming match:', error.message);
    next(error);
  }
};

// Get patients for hospital
export const getPatients = async (req, res, next) => {
  try {
    const { hospitalId } = req.params;
    const patients = await Patient.find({ hospitalId }).populate('hospitalId', 'name');
    res.json({
      success: true,
      data: patients
    });
  } catch (error) {
    next(error);
  }
};

// Recheck pending patients and send more proposals if needed
export const recheckPendingPatients = async () => {
  try {
    console.log('Rechecking pending patients...');
    const pendingPatients = await Patient.find({ status: 'PENDING' });

    for (const patient of pendingPatients) {
      const confirmedCount = patient.confirmedCount || 0;
      const deficit = patient.unitsNeeded - confirmedCount;

      if (deficit > 0) {
        // Find already proposed donors
        const proposedDonorIds = await Match.find({ patientId: patient._id }).distinct('donorId');

        // Find new donors
        const now = new Date();
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        const Hospital = (await import('../models/Hospital.js')).default;
        const hospital = await Hospital.findById(patient.hospitalId);
        if (!hospital) continue;

        const pipeline = [
          {
            $geoNear: {
              near: { type: 'Point', coordinates: hospital.location.coordinates },
              distanceField: 'distance',
              maxDistance: 25000, // expand to 25 km
              spherical: true
            }
          },
          {
            $match: {
              _id: { $nin: proposedDonorIds },
              bloodType: { $in: Object.keys(require('../utils/bloodCompatibility.js').compatibilityMap).filter(dt => isCompatible(dt, patient.bloodType)) },
              isVerifiedDonor: true,
              $or: [
                { lastDonationAt: { $lte: ninetyDaysAgo } },
                { lastDonationAt: null }
              ],
              $or: [
                { lastPingedAt: { $lte: fourteenDaysAgo } },
                { lastPingedAt: null }
              ]
            }
          },
          {
            $addFields: {
              random: { $rand: {} }
            }
          },
          {
            $sort: {
              distance: 1,
              lastDonationAt: 1,
              random: 1
            }
          },
          {
            $limit: deficit * 2 // batch more
          }
        ];

        const newDonors = await User.aggregate(pipeline);

        // Create proposals
        for (const donor of newDonors.slice(0, deficit)) {
          const token = crypto.randomBytes(32).toString('hex');
          const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

          const match = new Match({
            patientId: patient._id,
            donorId: donor._id,
            token,
            expiresAt
          });
          await match.save();

          await User.findByIdAndUpdate(donor._id, { lastPingedAt: now });

          console.log(`Sending SMS to new donor ${donor.phone}: Confirm donation at /confirm/${token}`);
        }
      }
    }
  } catch (error) {
    console.error('Error in recheck:', error.message);
  }
};
