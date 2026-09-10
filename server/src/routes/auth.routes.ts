import { Router } from "express";
import {
  register,
  login,
  logout,
} from "../controllers/auth.controller.js";
import { authLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.post("/register", register);
router.post(
  "/login",
  authLimiter,
  login,
);
router.post("/logout", logout);

export default router;