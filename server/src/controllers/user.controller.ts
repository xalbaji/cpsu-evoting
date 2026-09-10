import { Response } from "express";
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import { parse } from "csv-parse/sync";
import { AuthRequest } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { Vote } from "../models/Vote.js";

export async function getProfile(
  req: AuthRequest,
  res: Response,
) {
  const user = await User.findById(
    req.user?.userId,
  ).select("-passwordHash");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  return res.json({
    success: true,
    data: user,
  });
}

export async function getUsers(
  req: AuthRequest,
  res: Response,
) {
  const search = String(req.query.search ?? "").trim();
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(
    Math.max(Number(req.query.limit) || 10, 1),
    100,
  );
  const filter: Record<string, any> = search
    ? {
        role: "VOTER",
        $or: [
          { studentId: { $regex: search, $options: "i" } },
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }
    : { role: "VOTER" };

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-passwordHash")
      .sort({ lastName: 1, firstName: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);
  const votedUserIds = new Set(
    await Vote.distinct("voterId", {
      voterId: { $in: users.map((user) => user._id) },
    }),
  );
  const votedUserIdStrings = new Set(
    [...votedUserIds].map((id) => id.toString()),
  );

  return res.json({
    success: true,
    data: users.map((user) => ({
      ...user.toObject(),
      hasVoted: votedUserIdStrings.has(user._id.toString()),
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}

export async function getUser(
  req: AuthRequest,
  res: Response,
) {
  const user = await User.findById(
    req.params.id,
  ).select("-passwordHash");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  return res.json({
    success: true,
    data: user,
  });
}

export async function updateUser(
  req: AuthRequest,
  res: Response,
) {
  const allowedFields = [
    "firstName",
    "lastName",
    "email",
    "studentId",
    "course",
    "yearLevel",
    "avatarUrl",
    "isActive",
    "isVerified",
  ] as const;
  const updates: Partial<Record<(typeof allowedFields)[number], unknown>> = {};

  for (const field of allowedFields) {
    if (field in req.body) {
      updates[field] = req.body[field];
    }
  }

  const newPassword = typeof req.body.newPassword === "string"
    ? req.body.newPassword
    : "";
  if (newPassword && newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 8 characters.",
    });
  }

  const user = await User.findById(req.params.id).select("+passwordHash");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  Object.assign(user, updates);
  if (newPassword) {
    user.passwordHash = await bcrypt.hash(newPassword, 12);
  }
  await user.save();
  const safeUser = user.toObject();
  delete (safeUser as { passwordHash?: string }).passwordHash;

  return res.json({
    success: true,
    data: safeUser,
  });
}

export async function deleteUser(
  req: AuthRequest,
  res: Response,
) {
  const user = await User.findOne({
    _id: req.params.id,
    role: "VOTER",
  });
  if (!user) return res.status(404).json({ success: false, message: "Voter not found" });
  await user.deleteOne();
  return res.json({ success: true, message: "Voter deleted" });
}

export async function importVoters(
  req: AuthRequest,
  res: Response,
) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "CSV file is required",
    });
  }

  const rows = parse(req.file.buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];
  const requiredColumns = [
    "studentId",
    "firstName",
    "lastName",
    "email",
    "course",
    "yearLevel",
  ];
  const columns = Object.keys(rows[0] ?? {});
  const missingColumns = requiredColumns.filter(
    (column) => !columns.includes(column),
  );

  if (missingColumns.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing columns: ${missingColumns.join(", ")}`,
    });
  }

  const existing = await User.find({
    $or: [
      { studentId: { $in: rows.map((row) => row.studentId) } },
      { email: { $in: rows.map((row) => row.email.toLowerCase()) } },
    ],
  }).select("studentId email");
  const existingIds = new Set(existing.map((user) => user.studentId));
  const existingEmails = new Set(existing.map((user) => user.email));
  const seenIds = new Set<string>();
  const seenEmails = new Set<string>();
  const validRows: Record<string, string>[] = [];
  const errors: string[] = [];

  rows.forEach((row, index) => {
    const email = row.email.toLowerCase();
    if (
      !row.studentId ||
      !row.firstName ||
      !row.lastName ||
      !email.includes("@") ||
      existingIds.has(row.studentId) ||
      existingEmails.has(email) ||
      seenIds.has(row.studentId) ||
      seenEmails.has(email)
    ) {
      errors.push(`Row ${index + 2} is invalid or duplicated`);
      return;
    }
    seenIds.add(row.studentId);
    seenEmails.add(email);
    validRows.push({ ...row, email });
  });

  const passwordHash = await bcrypt.hash(
    crypto.randomBytes(24).toString("base64url"),
    12,
  );
  const users = await User.insertMany(
    validRows.map((row) => ({
      ...row,
      passwordHash,
      role: "VOTER",
      isActive: true,
      isVerified: false,
    })),
  );

  return res.status(201).json({
    success: true,
    data: {
      imported: users.length,
      rejected: errors.length,
      errors,
    },
  });
}

export async function updateProfile(req: AuthRequest, res: Response) {
  const user = await User.findById(req.user?.userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  const fields = ["firstName", "lastName", "course", "yearLevel", "avatarUrl"] as const;
  for (const field of fields) {
    if (field in req.body) user[field] = req.body[field];
  }
  await user.save();
  const safeUser = user.toObject();
  delete (safeUser as { passwordHash?: string }).passwordHash;
  return res.json({ success: true, data: safeUser });
}
