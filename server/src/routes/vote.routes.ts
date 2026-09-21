import { Router } from "express";
import {
  getBallot,
  submitVote,
  getMyVoteStatus,
  getMyVoteSelections,
  lookupVoteReceipt,
  lookupVoteReceiptAcrossElections,
} from "../controllers/vote.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = Router();

router.get(
  "/votes/vote-receipt",
  requireAuth,
  requireRole("ADMIN"),
  lookupVoteReceiptAcrossElections,
);

router.get(
  "/elections/:electionId/vote-receipt",
  requireAuth,
  requireRole("ADMIN"),
  lookupVoteReceipt,
);

router.get(
  "/elections/:electionId/ballot",
  requireAuth,
  requireRole("VOTER", "ADMIN"),
  getBallot,
);

router.post(
  "/elections/:electionId/vote",
  requireAuth,
  requireRole("VOTER", "ADMIN"),
  submitVote,
);

router.get(
  "/votes/my-status",
  requireAuth,
  requireRole("VOTER", "ADMIN"),
  getMyVoteStatus,
);

router.get(
  "/votes/:voteId/selections",
  requireAuth,
  requireRole("VOTER", "ADMIN"),
  getMyVoteSelections,
);

export default router;
