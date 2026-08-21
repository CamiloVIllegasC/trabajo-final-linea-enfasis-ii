import { Router } from "express";
import {
  asignarEspecialidad,
  crearHorario,
  getDoctors,
  getDoctorById,
  getDoctorAppointments,
  getDoctorAvailability
} from "../controllers/doctors.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = Router();

router.get(
  '/doctores', 
  authenticate,
  getDoctors
);

router.get(
  '/doctor/:id/citas',
  authenticate,
  authorize('DOCTOR', 'ADMIN'),
  getDoctorAppointments
);

router.get(
  '/doctor/:id', 
  authenticate, 
  getDoctorById
);

router.post(
  '/doctor/:id/especialidad',
  authenticate,
  authorize('ADMIN'),
  asignarEspecialidad
);

router.post(
  '/doctor/:id/horario',
  authenticate,
  crearHorario
);

// Disponibilidad pública por fecha (query: date=YYYY-MM-DD)
router.get(
  '/doctor/:id/available',
  getDoctorAvailability
);

export default router;