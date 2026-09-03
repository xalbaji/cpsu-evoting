import { Router } from "express";
import {
  getBallot,
  submitVote,
  getMyVoteStatus,
} from "../controllers/vote.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get(
  "/elections/:electionId/ballot",
  requireAuth,
  getBallot,
);

router.post(
  "/elections/:electionId/vote",
  requireAuth,
  submitVote,
);

router.get(
  "/votes/my-status",
  requireAuth,
  getMyVoteStatus,
);

export default router;