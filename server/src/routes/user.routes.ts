import { Router } from "express";
import multer from "multer";
import {
  getProfile,
  getUsers,
  getUser,
  updateUser,
  importVoters,
} from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

router.get(
  "/profile",
  requireAuth,
  getProfile,
);

router.get(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  getUsers,
);

router.get(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  getUser,
);

router.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  updateUser,
);

router.post(
  "/import",
  requireAuth,
  requireRole("ADMIN"),
  upload.single("file"),
  importVoters,
);

export default router;