import { Router } from 'express';
import { crearEspecialidad, getEspecialidades } from '../controllers/especialidades.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';

const router = Router();

router.post(
    '/especialidades',
    authenticate,
    authorize('ADMIN'),
    crearEspecialidad
);

router.get(
    '/especialidades',
    authenticate,
    getEspecialidades
)

export default router;