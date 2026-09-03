import { Router } from "express";
import {
  getElections,
  getElection,
  createElection,
  openElection,
  closeElection,
  publishResults,
} from "../controllers/election.controller.js";
import { getResults } from "../controllers/result.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  getElections,
);

router.get(
  "/:id",
  requireAuth,
  getElection,
);

router.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  createElection,
);

router.post(
  "/:id/open",
  requireAuth,
  requireRole("ADMIN"),
  openElection,
);

router.post(
  "/:id/close",
  requireAuth,
  requireRole("ADMIN"),
  closeElection,
);

router.post(
  "/:id/publish-results",
  requireAuth,
  requireRole("ADMIN"),
  publishResults,
);

router.get(
  "/:electionId/results",
  requireAuth,
  getResults,
);

export default router;