import { Router } from "express";
import {
  getPositions,
  createPosition,
  updatePosition,
  deletePosition,
} from "../controllers/position.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = Router();

router.get(
  "/elections/:electionId/positions",
  requireAuth,
  getPositions,
);

router.patch("/positions/:id", requireAuth, requireRole("ADMIN"), updatePosition);
router.delete("/positions/:id", requireAuth, requireRole("ADMIN"), deletePosition);

router.post(
  "/elections/:electionId/positions",
  requireAuth,
  requireRole("ADMIN"),
  createPosition,
);

export default router;