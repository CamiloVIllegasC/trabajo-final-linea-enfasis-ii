import { Router } from "express";
import { getAdminDashboard, getAllUsers } from "../controllers/admin.dashboard.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.get(
  '/dashboard', 
  authenticate,
  getAdminDashboard
);

router.get(
  '/users', 
  authenticate,
  getAllUsers
);

export default router;