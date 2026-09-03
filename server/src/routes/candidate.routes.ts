import { Router } from "express";
import {
  getCandidates,
  createCandidate,
  getCandidate,
  updateCandidate,
  deleteCandidate,
} from "../controllers/candidate.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = Router();

router.get(
  "/elections/:electionId/candidates",
  requireAuth,
  getCandidates,
);

router.post(
  "/candidates",
  requireAuth,
  requireRole("ADMIN"),
  createCandidate,
);

router.get("/candidates/:id", requireAuth, getCandidate);
router.patch("/candidates/:id", requireAuth, requireRole("ADMIN"), updateCandidate);
router.delete("/candidates/:id", requireAuth, requireRole("ADMIN"), deleteCandidate);

export default router;