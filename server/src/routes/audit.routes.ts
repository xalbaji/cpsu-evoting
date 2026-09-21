import { Router } from "express";
import { getAuditLogs, getMyAuditLogs } from "../controllers/audit.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = Router();

router.get(
  "/mine",
  requireAuth,
  requireRole("VOTER"),
  getMyAuditLogs,
);

router.get(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  getAuditLogs,
);

export default router;
