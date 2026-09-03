import { Router } from "express";
import {
  getPositions,
  createPosition,
} from "../controllers/position.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = Router();

router.get(
  "/elections/:electionId/positions",
  requireAuth,
  getPositions,
);

router.post(
  "/elections/:electionId/positions",
  requireAuth,
  requireRole("ADMIN"),
  createPosition,
);

export default router;