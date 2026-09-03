import { Router } from "express";
import { getAuditLogs } from "../controllers/audit.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  getAuditLogs,
);

export default router;
