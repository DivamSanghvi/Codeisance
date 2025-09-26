import { Router } from 'express';
import { createPatient, getPatients, confirmMatch } from '../controllers/Patient.controller.js';

const router = Router();

// POST /api/patients - create patient
router.post('/', createPatient);

// GET /api/patients/:hospitalId - get patients for hospital
router.get('/:hospitalId', getPatients);

// POST /api/matches/confirm/:token - confirm match
router.post('/confirm/:token', confirmMatch);

export default router;
