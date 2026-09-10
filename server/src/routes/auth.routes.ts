import { Router } from "express";
import {
  register,
  login,
  logout,
  changeAdminPassword,
} from "../controllers/auth.controller.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = Router();

router.post("/register", register);
router.post(
  "/login",
  authLimiter,
  login,
);
router.post("/logout", logout);
router.patch("/change-password", requireAuth, requireRole("ADMIN"), changeAdminPassword);

export default router;
