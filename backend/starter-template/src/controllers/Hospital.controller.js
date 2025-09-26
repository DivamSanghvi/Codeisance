import Hospital from '../models/Hospital.js';



// Get hospitals with pagination, search, geo
export const getHospitals = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, q, city, type, service, nearLon, nearLat, nearKm, includeInactive } = req.query;
    const skip = (page - 1) * limit;
    const maxLimit = Math.min(limit, 100);

    let match = {};
    if (!includeInactive || includeInactive !== '1') {
      match.isActive = true;
    }

    if (q) {
      match.$or = [
        { name: { $regex: q, $options: 'i' } },
        { 'address.city': { $regex: q, $options: 'i' } }
      ];
    }

    if (city) {
      match['address.city'] = { $regex: city, $options: 'i' };
    }

    if (type) {
      match.type = type.toUpperCase();
    }

    if (service) {
      match.services = { $in: [service] };
    }

    let pipeline = [
      { $match: match }
    ];

    // Add geo near if provided
    if (nearLon && nearLat && nearKm) {
      const maxDistance = parseFloat(nearKm) * 1000; // km to meters
      pipeline.unshift({
        $geoNear: {
          near: { type: 'Point', coordinates: [parseFloat(nearLon), parseFloat(nearLat)] },
          distanceField: 'distance',
          maxDistance,
          spherical: true
        }
      });
    }

    pipeline.push(
      { $sort: nearLon && nearLat ? { distance: 1 } : { createdAt: -1 } },
      { $skip: skip },
      { $limit: maxLimit }
    );

    const hospitals = await Hospital.aggregate(pipeline);
    const total = await Hospital.countDocuments(match);

    res.json({
      success: true,
      data: hospitals,
      page: parseInt(page),
      limit: maxLimit,
      total
    });
  } catch (error) {
    next(error);
  }
};

// Get hospital by ID
export const getHospitalById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hospital = await Hospital.findById(id);
    if (!hospital || (!req.query.includeInactive && !hospital.isActive)) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }
    res.json({
      success: true,
      data: hospital
    });
  } catch (error) {
    next(error);
  }
};

// Update hospital (partial)
export const updateHospital = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hospital = await Hospital.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }
    res.json({
      success: true,
      data: hospital
    });
  } catch (error) {
    next(error);
  }
};

// Soft delete hospital
export const deleteHospital = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hospital = await Hospital.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }
    res.json({
      success: true,
      message: 'Hospital deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
