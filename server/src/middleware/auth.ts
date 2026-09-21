import { Request, Response, NextFunction } from "express";
import { User } from "../models/User.js";
import { verifyAccessToken } from "../utils/jwt.js";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const tokenUser = verifyAccessToken(token);
    const currentUser = await User.findById(tokenUser.userId).select("role isActive");

    if (!currentUser || !currentUser.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account is no longer active",
      });
    }

    // Refresh the role from the database so promotions and removals apply
    // immediately instead of waiting for the JWT to expire.
    req.user = {
      userId: currentUser._id.toString(),
      role: currentUser.role,
    };

    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired session",
    });
  }
}
