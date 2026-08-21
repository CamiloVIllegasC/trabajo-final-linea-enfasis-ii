import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { crearCita, updateStatusCita, cancelCita, citasPaciente, getAppointments } from '../controllers/citas.controller.js';

const router = Router();

router.post(
    '/citas',
    authenticate,
    authorize('PATIENT'),
    crearCita
);

router.put(
  '/cita/:id/status',
  authenticate,
  authorize('DOCTOR', 'ADMIN'),
  updateStatusCita
);

router.put(
  '/cita/:id/cancel',
  authenticate,
  authorize('PATIENT'),
  cancelCita
);

router.get(
  '/citas/me',
  authenticate,
  authorize('PATIENT'),
  citasPaciente
);

router.get(
  '/admin/citas',
  authenticate,
  authorize('ADMIN'),
  getAppointments
);

export default router;
