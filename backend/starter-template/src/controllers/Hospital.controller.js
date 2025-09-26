import Hospital from '../models/Hospital.js';

// Helper to get lat/lon from pincode using Nominatim
const getLatLonFromPincode = async (pincode, country) => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&postalcode=${encodeURIComponent(pincode)}&country=${encodeURIComponent(country)}&limit=1`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    }
    throw new Error('No location found for pincode');
  } catch (error) {
    console.error('Error fetching location from pincode:', error.message);
    throw error;
  }
};

// Create hospital
export const createHospital = async (req, res, next) => {
  try {
    console.log('Creating hospital with data:', req.body);
    // Additional check for required fields
    const requiredFields = ['name', 'licenseNo', 'address'];
    const missing = requiredFields.filter(field => !req.body[field]);
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(', ')}`
      });
    }
    // If location not provided, fetch from pincode
    if (!req.body.location) {
      try {
        const { lat, lon } = await getLatLonFromPincode(req.body.address.pincode, req.body.address.country);
        req.body.location = {
          type: 'Point',
          coordinates: [lon, lat]
        };
        console.log('Fetched location from pincode:', req.body.location);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Unable to fetch location from pincode'
        });
      }
    }
    const hospital = new Hospital(req.body);
    await hospital.save();
    console.log('Hospital created successfully:', hospital._id);
    res.status(201).json({
      success: true,
      data: hospital
    });
  } catch (error) {
    console.error('Error creating hospital:', error.message);
    next(error);
  }
};

// Get hospitals list with pagination, search, filters, geo
export const getHospitals = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, q, city, type, service, nearLon, nearLat, nearKm, includeInactive } = req.query;
    console.log('Listing hospitals with query:', req.query);
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;

    let match = { isActive: true };
    if (includeInactive === '1') {
      delete match.isActive;
    }

    if (q) {
      match.$or = [
        { name: { $regex: q, $options: 'i' } },
        { 'address.city': { $regex: q, $options: 'i' } }
      ];
    }
    if (city) {
      match['address.city'] = city;
    }
    if (type) {
      match.type = type.toUpperCase();
    }
    if (service) {
      match.services = { $in: [service] };
    }

    const pipeline = [];
    if (nearLon && nearLat) {
      const maxDistance = nearKm ? parseFloat(nearKm) * 1000 : undefined; // meters
      pipeline.push({
        $geoNear: {
          near: { type: 'Point', coordinates: [parseFloat(nearLon), parseFloat(nearLat)] },
          distanceField: 'distance',
          maxDistance,
          spherical: true
        }
      });
    }

    pipeline.push({ $match: match });
    const countPipeline = [...pipeline, { $count: 'total' }];
    const totalResult = await Hospital.aggregate(countPipeline);
    const total = totalResult[0]?.total || 0;

    pipeline.push({ $sort: nearLon ? { distance: 1 } : { createdAt: -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limitNum });

    const hospitals = await Hospital.aggregate(pipeline);

    res.json({
      success: true,
      data: hospitals,
      page: pageNum,
      limit: limitNum,
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
    const { includeInactive } = req.query;
    console.log('Getting hospital by ID:', id, 'includeInactive:', includeInactive);
    const match = { _id: id };
    if (includeInactive !== '1') {
      match.isActive = true;
    }
    const hospital = await Hospital.findOne(match);
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

// Update hospital
export const updateHospital = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    console.log('Updating hospital ID:', id, 'with data:', updateData);
    // Check if any update data is provided
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No update data provided'
      });
    }
    const hospital = await Hospital.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }
    console.log('Hospital updated successfully:', hospital._id);
    res.json({
      success: true,
      data: hospital
    });
  } catch (error) {
    console.error('Error updating hospital:', error.message);
    next(error);
  }
};

// Soft delete hospital
export const deleteHospital = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log('Soft deleting hospital ID:', id);
    const hospital = await Hospital.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }
    console.log('Hospital soft deleted successfully:', hospital._id);
    res.json({
      success: true,
      message: 'Hospital deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting hospital:', error.message);
    next(error);
  }
};
