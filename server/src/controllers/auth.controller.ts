import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { User } from "../models/User.js";
import { createAccessToken } from "../utils/jwt.js";
import {
  loginSchema,
  registerSchema,
  changePasswordSchema,
} from "../validators/auth.validator.js";
import { AuthRequest } from "../middleware/auth.js";
import { normalizeCourse } from "../constants/courses.js";
import { isSuperAdmin } from "../utils/courseAccess.js";

export async function register(
  req: Request,
  res: Response,
) {
  try {
    const parsed = registerSchema.safeParse(
      req.body,
    );

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration data",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const {
      studentId,
      firstName,
      middleInitial,
      lastName,
      suffix,
      email,
      password,
      course,
      yearLevel,
    } = parsed.data;

    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { studentId },
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "Email or Student ID is already registered",
      });
    }

    const passwordHash = await bcrypt.hash(
      password,
      12,
    );

    const user = await User.create({
      studentId,
      firstName,
      middleInitial: middleInitial ? middleInitial.toUpperCase() : "",
      lastName,
      suffix: suffix ?? "",
      email: email.toLowerCase(),
      passwordHash,
      course: normalizeCourse(course),
      yearLevel,
      role: "VOTER",
      isActive: true,
      isVerified: false,
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        _id: user._id.toString(),
        id: user._id.toString(),
        studentId: user.studentId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Email or Student ID is already registered",
      });
    }

    console.error("Registration failed:", error);

    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
}

export async function login(
  req: Request,
  res: Response,
) {
  try {
    const isProduction =
      process.env.NODE_ENV === "production" ||
      Boolean(process.env.RENDER);

    const parsed = loginSchema.safeParse(
      req.body,
    );

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid login data",
      });
    }

    const { email, password } = parsed.data;

    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select("+passwordHash");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.passwordHash,
    );

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is being reviewed for suspicious activity. Please contact an administrator.",
      });
    }

    const token = createAccessToken({
      userId: user._id.toString(),
      role: user.role,
    });

    res.cookie("token", token, {
      httpOnly: true,
      // Local development runs over HTTP, while hosted deployments run over
      // HTTPS and need a cross-site cookie for the separate client/server apps.
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return res.json({
      success: true,
      message: "Login successful",
      data: {
        _id: user._id.toString(),
        id: user._id.toString(),
        firstName: user.firstName,
        middleInitial: user.middleInitial,
        lastName: user.lastName,
        suffix: user.suffix,
        email: user.email,
        role: user.role,
        course: user.course,
        yearLevel: user.yearLevel,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
        isVerified: user.isVerified,
        managedCourses: user.managedCourses,
        isSuperAdmin: isSuperAdmin(user),
      },
    });
  } catch (error) {
    console.error("Login failed:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
}

export async function logout(
  _req: Request,
  res: Response,
) {
  const isProduction =
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.RENDER);

  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });

  return res.json({
    success: true,
    message: "Logged out successfully",
  });
}

export async function changeAdminPassword(
  req: AuthRequest,
  res: Response,
) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Administrator access required" });
  }

  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 8 characters.",
    });
  }

  const user = await User.findById(req.user.userId).select("+passwordHash");
  if (!user || user.role !== "ADMIN") {
    return res.status(404).json({ success: false, message: "Administrator account not found" });
  }

  user.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await user.save();

  return res.json({ success: true, message: "Administrator password changed successfully" });
}
