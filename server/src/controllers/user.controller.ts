import { Response } from "express";
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import { parse } from "csv-parse/sync";
import { AuthRequest } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { Vote } from "../models/Vote.js";
import { createAuditLog } from "../utils/audit.js";
import { isKnownCourse, normalizeCourse } from "../constants/courses.js";
import { canManageCourse, getAccessUser, isCpsuAdministrator, isSuperAdmin, managedCourseCodes } from "../utils/courseAccess.js";

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

  const profile = user.toObject();
  if (user.role === "ADMIN") profile.isSuperAdmin = isSuperAdmin(user);

  return res.json({
    success: true,
    data: profile,
  });
}

export async function getAdmins(req: AuthRequest, res: Response) {
  const actor = await getAccessUser(req.user!.userId);
  if (!actor || !isSuperAdmin(actor)) {
    return res.status(403).json({ success: false, message: "Only a super administrator can manage administrator access" });
  }

  const admins = await User.find({ role: "ADMIN" })
    .select("studentId firstName lastName email course managedCourses isSuperAdmin isActive")
    .sort({ lastName: 1, firstName: 1 });

  return res.json({
    success: true,
    data: admins.map((admin) => ({
      ...admin.toObject(),
      isSuperAdmin: isSuperAdmin(admin),
    })),
  });
}

export async function updateAdminScope(req: AuthRequest, res: Response) {
  const actor = await getAccessUser(req.user!.userId);
  if (!actor || !isSuperAdmin(actor)) {
    return res.status(403).json({ success: false, message: "Only a super administrator can manage administrator access" });
  }

  const admin = await User.findOne({ _id: req.params.id, role: "ADMIN" });
  if (!admin) return res.status(404).json({ success: false, message: "Administrator not found" });

  const requestedCourses = Array.isArray(req.body.managedCourses) ? req.body.managedCourses as unknown[] : [];
  const managedCourses: string[] = Array.from(new Set(
    requestedCourses
      .map((value) => normalizeCourse(value))
      .filter((value): value is string => Boolean(value)),
  ));
  const protectedSuperAdmin = isCpsuAdministrator(admin);
  if (protectedSuperAdmin && req.body.isSuperAdmin === false) {
    return res.status(400).json({ success: false, message: "The CPSU Administrator account must remain a super administrator" });
  }
  const nextIsSuperAdmin = protectedSuperAdmin || Boolean(req.body.isSuperAdmin);
  if (managedCourses.some((course) => !isKnownCourse(course))) {
    return res.status(400).json({ success: false, message: "Every assigned course must be a valid CPSU Main Campus course" });
  }
  if (!nextIsSuperAdmin && managedCourses.length === 0) {
    return res.status(400).json({ success: false, message: "Assign at least one course or enable all-course access" });
  }
  if (admin._id.toString() === req.user!.userId && !nextIsSuperAdmin) {
    return res.status(400).json({ success: false, message: "You cannot remove your own super administrator access" });
  }

  admin.managedCourses = nextIsSuperAdmin ? [] : managedCourses;
  admin.isSuperAdmin = nextIsSuperAdmin;
  await admin.save();

  return res.json({
    success: true,
    data: {
      _id: admin._id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      course: admin.course,
      managedCourses: admin.managedCourses,
      isSuperAdmin: isSuperAdmin(admin),
      isActive: admin.isActive,
    },
  });
}

export async function promoteUserToAdmin(req: AuthRequest, res: Response) {
  const actor = await getAccessUser(req.user!.userId);
  if (!actor || !isSuperAdmin(actor)) {
    return res.status(403).json({ success: false, message: "Only a super administrator can promote voters" });
  }

  const voter = await User.findOne({ _id: req.params.id, role: "VOTER" });
  if (!voter) return res.status(404).json({ success: false, message: "Voter not found" });

  const voterCourse = normalizeCourse(voter.course);
  if (!isKnownCourse(voterCourse)) {
    return res.status(400).json({
      success: false,
      message: "The voter must have a valid CPSU Main Campus course before promotion",
    });
  }

  const requestedCourses = Array.isArray(req.body.managedCourses)
    ? req.body.managedCourses as unknown[]
    : [voterCourse];
  const managedCourses = Array.from(new Set(
    requestedCourses
      .map((value) => normalizeCourse(value))
      .filter((value): value is string => Boolean(value)),
  ));

  if (managedCourses.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Select at least one course to manage",
    });
  }
  if (managedCourses.some((course) => !isKnownCourse(course))) {
    return res.status(400).json({
      success: false,
      message: "Every assigned course must be a valid CPSU Main Campus course",
    });
  }

  voter.role = "ADMIN";
  voter.isSuperAdmin = false;
  voter.managedCourses = managedCourses;
  await voter.save();

  await createAuditLog({
    userId: req.user?.userId,
    action: "ADMIN_PROMOTED",
    resource: "User",
    resourceId: voter._id.toString(),
     description: `Promoted ${voter.firstName} ${voter.lastName} to Course Moderator for ${managedCourses.join(", ")}`,
    ipAddress: req.ip,
    metadata: { managedCourses },
  });

  const safeUser = voter.toObject();
  delete (safeUser as { passwordHash?: string }).passwordHash;
  return res.status(201).json({
    success: true,
    message: `${voter.firstName} ${voter.lastName} is now a Course Moderator`,
    data: safeUser,
  });
}

export async function demoteAdminToVoter(req: AuthRequest, res: Response) {
  const actor = await getAccessUser(req.user!.userId);
  if (!actor || !isSuperAdmin(actor)) {
    return res.status(403).json({ success: false, message: "Only a super administrator can remove administrator access" });
  }

  if (req.params.id === req.user!.userId) {
    return res.status(400).json({ success: false, message: "You cannot remove your own administrator access" });
  }

  const admin = await User.findOne({ _id: req.params.id, role: "ADMIN" });
  if (!admin) return res.status(404).json({ success: false, message: "Administrator not found" });
  if (isCpsuAdministrator(admin)) {
    return res.status(400).json({ success: false, message: "The CPSU Administrator account must remain a super administrator" });
  }
  if (!isKnownCourse(normalizeCourse(admin.course))) {
    return res.status(400).json({ success: false, message: "This administrator has no valid voter course and cannot be demoted automatically" });
  }

  admin.role = "VOTER";
  admin.isSuperAdmin = false;
  admin.managedCourses = [];
  await admin.save();

  await createAuditLog({
    userId: req.user?.userId,
    action: "ADMIN_DEMOTED",
    resource: "User",
    resourceId: admin._id.toString(),
    description: `Removed administrator access from ${admin.firstName} ${admin.lastName}`,
    ipAddress: req.ip,
    metadata: { course: normalizeCourse(admin.course) },
  });

  const safeUser = admin.toObject();
  delete (safeUser as { passwordHash?: string }).passwordHash;
  return res.json({
    success: true,
    message: `${admin.firstName} ${admin.lastName} is now a voter again`,
    data: safeUser,
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
  const admin = await getAccessUser(req.user!.userId);
  if (!admin) return res.status(401).json({ success: false, message: "User not found" });

  const filter: Record<string, any> = { role: "VOTER" };
  if (!isSuperAdmin(admin)) filter.course = { $in: managedCourseCodes(admin) };
  if (search) {
    filter.$or = [
      { studentId: { $regex: search, $options: "i" } },
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { course: { $regex: search, $options: "i" } },
    ];
  }

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

  if (user.role !== "VOTER") {
    return res.status(404).json({
      success: false,
      message: "Voter not found",
    });
  }

  const admin = await getAccessUser(req.user!.userId);
  if (!admin || !canManageCourse(admin, user.course)) {
    return res.status(403).json({ success: false, message: "You are not assigned to manage this voter" });
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
    "middleInitial",
    "lastName",
    "suffix",
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

  if (user.role !== "VOTER") {
    return res.status(404).json({
      success: false,
      message: "Voter not found",
    });
  }

  const admin = await getAccessUser(req.user!.userId);
  if (!admin || !canManageCourse(admin, user.course)) {
    return res.status(403).json({ success: false, message: "You are not assigned to manage this voter" });
  }

  if ("course" in updates) {
    const normalizedCourse = normalizeCourse(updates.course);
    if (!isKnownCourse(normalizedCourse)) {
      return res.status(400).json({ success: false, message: "Select a valid CPSU Main Campus course" });
    }
    if (!canManageCourse(admin, normalizedCourse)) {
      return res.status(403).json({ success: false, message: "You are not assigned to manage the selected course" });
    }
    updates.course = normalizedCourse;
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
  const admin = await getAccessUser(req.user!.userId);
  if (!admin || !canManageCourse(admin, user.course)) {
    return res.status(403).json({ success: false, message: "You are not assigned to manage this voter" });
  }
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

  const admin = await getAccessUser(req.user!.userId);
  if (!admin) return res.status(401).json({ success: false, message: "User not found" });

  const parsedRows = parse(req.file.buffer, {
    skip_empty_lines: true,
    trim: true,
  }) as string[][];
  const requiredColumns = [
    "studentId",
    "firstName",
    "lastName",
    "email",
    "course",
    "yearLevel",
  ];
  const firstRow = (parsedRows[0] ?? []).map((value) =>
    value.replace(/^\uFEFF/, "").trim(),
  );
  const hasHeader = requiredColumns.every((column) => firstRow.includes(column));
  const dataRows = parsedRows.map((values) => {
    const normalized = [...values];
    while (normalized.length > 0 && normalized[normalized.length - 1] === "") {
      normalized.pop();
    }
    return normalized;
  });
  const rows: Record<string, string>[] = hasHeader
    ? dataRows.slice(1).map((values) =>
        Object.fromEntries(firstRow.map((column, index) => [column, values[index] ?? ""])),
      )
    : dataRows.every((values) => values.length === requiredColumns.length)
      ? dataRows.map((values) =>
          Object.fromEntries(requiredColumns.map((column, index) => [column, values[index] ?? ""])),
        )
      : [];

  if (rows.length === 0 && parsedRows.length > 0) {
    return res.status(400).json({
      success: false,
      message: `CSV must include these columns: ${requiredColumns.join(", ")} or contain exactly six values per row in that order.`,
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
      !isKnownCourse(row.course) ||
      !canManageCourse(admin, row.course) ||
      !email.includes("@") ||
      existingIds.has(row.studentId) ||
      existingEmails.has(email) ||
      seenIds.has(row.studentId) ||
      seenEmails.has(email)
    ) {
      errors.push(`Row ${index + (hasHeader ? 2 : 1)} is invalid or duplicated`);
      return;
    }
    seenIds.add(row.studentId);
    seenEmails.add(email);
    validRows.push({ ...row, email, course: normalizeCourse(row.course) });
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
  const fields = ["firstName", "middleInitial", "lastName", "suffix", "yearLevel", "avatarUrl"] as const;
  for (const field of fields) {
    if (field in req.body) user[field] = req.body[field];
  }
  await user.save();
  const safeUser = user.toObject();
  delete (safeUser as { passwordHash?: string }).passwordHash;
  return res.json({ success: true, data: safeUser });
}
