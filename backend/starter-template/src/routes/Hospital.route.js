import { Router } from 'express';
import {
  getHospitals,
  getHospitalById,
  updateHospital,
  deleteHospital
} from '../controllers/Hospital.controller.js';


const router = Router();

router.get('/',getHospitals);
router.get('/:id', getHospitalById);
router.patch('/:id', updateHospital);
router.delete('/:id', deleteHospital);

export default router;
