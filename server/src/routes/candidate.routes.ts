import { Router } from "express";
import {
  getCandidates,
  createCandidate,
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

export default router;