import { Router } from "express";
import {
  getBallot,
  submitVote,
  getMyVoteStatus,
} from "../controllers/vote.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = Router();

router.get(
  "/elections/:electionId/ballot",
  requireAuth,
  requireRole("VOTER"),
  getBallot,
);

router.post(
  "/elections/:electionId/vote",
  requireAuth,
  requireRole("VOTER"),
  submitVote,
);

router.get(
  "/votes/my-status",
  requireAuth,
  requireRole("VOTER"),
  getMyVoteStatus,
);

export default router;