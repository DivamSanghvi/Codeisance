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

router.post('/', validateCreateHospital, createHospital);
router.get('/', validateListHospitals, getHospitals);
router.get('/:id', validateGetHospital, getHospitalById);
router.patch('/:id', validateGetHospital, validateUpdateHospital, updateHospital);
router.delete('/:id', validateDeleteHospital, deleteHospital);

export default router;
