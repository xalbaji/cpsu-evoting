import { Router } from "express";
import multer from "multer";
import {
  getProfile,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  importVoters,
  updateProfile,
  getAdmins,
  updateAdminScope,
  promoteUserToAdmin,
  demoteAdminToVoter,
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

router.patch("/profile", requireAuth, updateProfile);

router.get("/admins", requireAuth, requireRole("ADMIN"), getAdmins);
router.patch("/admins/:id/scope", requireAuth, requireRole("ADMIN"), updateAdminScope);
router.post("/admins/:id/promote", requireAuth, requireRole("ADMIN"), promoteUserToAdmin);
router.post("/admins/:id/demote", requireAuth, requireRole("ADMIN"), demoteAdminToVoter);

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

router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  deleteUser,
);

router.post(
  "/import",
  requireAuth,
  requireRole("ADMIN"),
  upload.single("file"),
  importVoters,
);

export default router;
