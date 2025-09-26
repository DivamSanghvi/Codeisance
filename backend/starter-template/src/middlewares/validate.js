import mongoose from 'mongoose';

// Helper to send validation error
const sendValidationError = (res, message, details) => {
  return res.status(400).json({
    success: false,
    message,
    details
  });
};

// Validate ObjectId
const validateObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Validate create hospital body
export const validateCreateHospital = (req, res, next) => {
  const { name, type, licenseNo, contact, address, location, services } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.length > 120) {
    errors.push('Name is required, must be string 2-120 chars');
  }
  if (type && !['HOSPITAL', 'BLOOD_BANK', 'CLINIC'].includes(type.toUpperCase())) {
    errors.push('Type must be HOSPITAL, BLOOD_BANK, or CLINIC');
  }
  if (!licenseNo || typeof licenseNo !== 'string' || !licenseNo.trim()) {
    errors.push('LicenseNo is required and must be non-empty string');
  }
  if (contact) {
    if (contact.phone && typeof contact.phone !== 'string') {
      errors.push('Contact phone must be string');
    }
    if (contact.email && (typeof contact.email !== 'string' || !contact.email.includes('@'))) {
      errors.push('Contact email must be valid string');
    }
  }
  if (!address || typeof address !== 'object') {
    errors.push('Address is required');
  } else {
    if (!address.line1 || typeof address.line1 !== 'string' || !address.line1.trim()) {
      errors.push('Address line1 is required');
    }
    if (!address.city || typeof address.city !== 'string' || !address.city.trim()) {
      errors.push('Address city is required');
    }
    if (!address.state || typeof address.state !== 'string' || !address.state.trim()) {
      errors.push('Address state is required');
    }
    if (!address.pincode) {
      errors.push('Address pincode is required');
    }
    if (!address.country || typeof address.country !== 'string' || !address.country.trim()) {
      errors.push('Address country is required');
    }
  }
  if (location) {
    if (!location.type || location.type !== 'Point' || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
      errors.push('Location must be GeoJSON Point with [lon, lat]');
    } else {
      const [lon, lat] = location.coordinates;
      if (typeof lon !== 'number' || lon < -180 || lon > 180 || typeof lat !== 'number' || lat < -90 || lat > 90) {
        errors.push('Invalid coordinates');
      }
    }
  }
  if (services && (!Array.isArray(services) || services.some(s => typeof s !== 'string'))) {
    errors.push('Services must be array of strings');
  }

  if (errors.length > 0) {
    return sendValidationError(res, 'Validation error', errors);
  }
  next();
};

// Validate list query params
export const validateListHospitals = (req, res, next) => {
  const { page, limit, q, city, type, service, nearLon, nearLat, nearKm, includeInactive } = req.query;
  const errors = [];

  if (page && (isNaN(page) || page < 1)) {
    errors.push('Page must be positive number');
  }
  if (limit && (isNaN(limit) || limit < 1 || limit > 100)) {
    errors.push('Limit must be 1-100');
  }
  if (q && typeof q !== 'string') {
    errors.push('q must be string');
  }
  if (city && typeof city !== 'string') {
    errors.push('city must be string');
  }
  if (type && !['HOSPITAL', 'BLOOD_BANK', 'CLINIC'].includes(type.toUpperCase())) {
    errors.push('type must be HOSPITAL, BLOOD_BANK, or CLINIC');
  }
  if (service && typeof service !== 'string') {
    errors.push('service must be string');
  }
  if (nearLon && (isNaN(nearLon) || nearLon < -180 || nearLon > 180)) {
    errors.push('nearLon must be valid longitude');
  }
  if (nearLat && (isNaN(nearLat) || nearLat < -90 || nearLat > 90)) {
    errors.push('nearLat must be valid latitude');
  }
  if (nearKm && (isNaN(nearKm) || nearKm < 0)) {
    errors.push('nearKm must be non-negative number');
  }
  if (includeInactive && includeInactive !== '1') {
    errors.push('includeInactive must be 1 or omitted');
  }

  if (errors.length > 0) {
    return sendValidationError(res, 'Validation error', errors);
  }
  next();
};

// Validate get by id params
export const validateGetHospital = (req, res, next) => {
  const { id } = req.params;
  if (!validateObjectId(id)) {
    return sendValidationError(res, 'Invalid hospital ID');
  }
  next();
};

// Validate update body (partial)
export const validateUpdateHospital = (req, res, next) => {
  const body = req.body;
  const errors = [];

  if (body.name && (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.length > 120)) {
    errors.push('Name must be string 2-120 chars');
  }
  if (body.type && !['HOSPITAL', 'BLOOD_BANK', 'CLINIC'].includes(body.type.toUpperCase())) {
    errors.push('Type must be HOSPITAL, BLOOD_BANK, or CLINIC');
  }
  if (body.licenseNo && (typeof body.licenseNo !== 'string' || !body.licenseNo.trim())) {
    errors.push('LicenseNo must be non-empty string');
  }
  if (body.contact) {
    if (body.contact.phone && typeof body.contact.phone !== 'string') {
      errors.push('Contact phone must be string');
    }
    if (body.contact.email && (typeof body.contact.email !== 'string' || !body.contact.email.includes('@'))) {
      errors.push('Contact email must be valid string');
    }
  }
  if (body.address) {
    if (body.address.line1 && (typeof body.address.line1 !== 'string' || !body.address.line1.trim())) {
      errors.push('Address line1 must be non-empty string');
    }
    if (body.address.city && (typeof body.address.city !== 'string' || !body.address.city.trim())) {
      errors.push('Address city must be non-empty string');
    }
    if (body.address.state && (typeof body.address.state !== 'string' || !body.address.state.trim())) {
      errors.push('Address state must be non-empty string');
    }
    if (body.address.pincode && !body.address.pincode) {
      errors.push('Address pincode required if provided');
    }
    if (body.address.country && (typeof body.address.country !== 'string' || !body.address.country.trim())) {
      errors.push('Address country must be non-empty string');
    }
  }
  if (body.location) {
    if (!body.location.type || body.location.type !== 'Point' || !Array.isArray(body.location.coordinates) || body.location.coordinates.length !== 2) {
      errors.push('Location must be GeoJSON Point with [lon, lat]');
    } else {
      const [lon, lat] = body.location.coordinates;
      if (typeof lon !== 'number' || lon < -180 || lon > 180 || typeof lat !== 'number' || lat < -90 || lat > 90) {
        errors.push('Invalid coordinates');
      }
    }
  }
  if (body.services && (!Array.isArray(body.services) || body.services.some(s => typeof s !== 'string'))) {
    errors.push('Services must be array of strings');
  }

  if (errors.length > 0) {
    return sendValidationError(res, 'Validation error', errors);
  }
  next();
};

// Validate delete params (same as get)
export const validateDeleteHospital = validateGetHospital;
