import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { getAdminDashboard } from "../controllers/dashboard.controller.js";

const router = Router();

router.get(
  "/dashboard",
  requireAuth,
  requireRole("ADMIN"),
  getAdminDashboard,
);

export default router;