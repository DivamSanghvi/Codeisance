import { Router } from 'express';
import {
  createHospital,
  getHospitals,
  getHospitalById,
  updateHospital,
  deleteHospital
} from '../controllers/Hospital.controller.js';
import {
  validateCreateHospital,
  validateListHospitals,
  validateGetHospital,
  validateUpdateHospital,
  validateDeleteHospital
} from '../middlewares/validate.js';

const router = Router();

// POST /api/hospitals
router.post('/', validateCreateHospital, createHospital);

// GET /api/hospitals
router.get('/', validateListHospitals, getHospitals);

// GET /api/hospitals/:id
router.get('/:id', validateGetHospital, getHospitalById);

// PATCH /api/hospitals/:id
router.patch('/:id', validateGetHospital, validateUpdateHospital, updateHospital);

// DELETE /api/hospitals/:id
router.delete('/:id', validateDeleteHospital, deleteHospital);

export default router;
