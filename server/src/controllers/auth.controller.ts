import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { User } from "../models/User.js";
import { createAccessToken } from "../utils/jwt.js";
import {
  loginSchema,
  registerSchema,
} from "../validators/auth.validator.js";

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
      lastName,
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
      lastName,
      email: email.toLowerCase(),
      passwordHash,
      course,
      yearLevel,
      role: "VOTER",
      isActive: true,
      isVerified: false,
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        id: user._id,
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
    const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER;

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

    if (!user || !user.isActive) {
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

    const token = createAccessToken({
      userId: user._id.toString(),
      role: user.role,
    });

    res.cookie("token", token, {
  httpOnly: true,
  secure: true, // Must be true on Render (HTTPS)
  sameSite: "none", // Required for cross-site cookies between Vercel and Render
  maxAge: 24 * 60 * 60 * 1000, // 1 day
});

    return res.json({
      success: true,
      message: "Login successful",
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        course: user.course,
        yearLevel: user.yearLevel
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
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  return res.json({
    success: true,
    message: "Logged out successfully",
  });
}