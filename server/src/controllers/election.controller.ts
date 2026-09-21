import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { Election } from "../models/Election.js";
import { Candidate } from "../models/Candidate.js";
import { Position } from "../models/Position.js";
import { Vote } from "../models/Vote.js";
import { VoteSelection } from "../models/VoteSelection.js";
import { createAuditLog } from "../utils/audit.js";
import { isKnownCourse, normalizeCourse } from "../constants/courses.js";
import {
  adminElectionFilter,
  canManageCourse,
  courseMatches,
  electionCourseCodes,
  getAccessUser,
  isElectionVisibleToVoters,
  isSuperAdmin,
} from "../utils/courseAccess.js";
import { clearElectionApproval } from "../utils/electionApproval.js";
import { getVotingWindowState, syncElectionStatuses } from "../utils/electionWindow.js";

type ElectionCourseTarget = { course?: unknown; courses?: unknown };

function requestedElectionCourses(input: unknown, fallback: unknown): string[] {
  const values = Array.isArray(input) ? input : input ? [input] : (Array.isArray(fallback) ? fallback : [fallback]);
  return Array.from(new Set(values.map(normalizeCourse).filter(Boolean)));
}

async function canManageElection(req: AuthRequest, election: ElectionCourseTarget) {
  const user = await getAccessUser(req.user!.userId);
  return Boolean(user && canManageCourse(user, electionCourseCodes(election)));
}

async function canViewElection(req: AuthRequest, election: ElectionCourseTarget & { status?: string }) {
  const user = await getAccessUser(req.user!.userId);
  if (!user) return false;
  const targetCourses = electionCourseCodes(election);
  if (user.role === "ADMIN") return canManageCourse(user, targetCourses);
  return user.role === "VOTER" && isElectionVisibleToVoters(election.status) && courseMatches(user.course, targetCourses);
}

export async function getElections(
  req: AuthRequest,
  res: Response,
) {
  await syncElectionStatuses();

  const user = await getAccessUser(req.user!.userId);
  if (!user) return res.status(401).json({ success: false, message: "User not found" });

  const filter = user.role === "ADMIN"
    ? adminElectionFilter(user)
    : {
        $or: [
          { course: normalizeCourse(user.course) },
          { courses: normalizeCourse(user.course) },
        ],
        status: { $in: ["SCHEDULED", "ACTIVE", "CLOSED", "RESULTS_PUBLISHED"] },
      };

  const elections = await Election.find(filter)
    .sort({ startDate: -1 });

  const votedElectionIds = new Set(
    (elections.length > 0
      ? await Vote.distinct("electionId", {
          voterId: req.user!.userId,
          electionId: { $in: elections.map((election) => election._id) },
        })
      : []
    ).map((electionId) => electionId.toString()),
  );

  return res.json({
    success: true,
    data: elections.map((election) => ({
      ...election.toObject(),
      hasVoted: votedElectionIds.has(election._id.toString()),
    })),
  });
}

export async function getElection(
  req: AuthRequest,
  res: Response,
) {
  await syncElectionStatuses();

  const election = await Election.findById(
    req.params.id,
  );

  if (!election) {
    return res.status(404).json({
      success: false,
      message: "Election not found",
    });
  }

  if (!(await canViewElection(req, election))) {
    return res.status(403).json({
      success: false,
      message: "This election is not available for your course.",
    });
  }

  return res.json({
    success: true,
    data: election,
  });
}

export async function createElection(
  req: AuthRequest,
  res: Response,
) {
  const {
    title,
    description,
    academicYear,
    course,
    courses,
    startDate,
    endDate,
  } = req.body;

  const normalizedCourses = requestedElectionCourses(courses, course);
  if (!normalizedCourses.length || normalizedCourses.some((selectedCourse) => !isKnownCourse(selectedCourse))) {
    return res.status(400).json({ success: false, message: "Select at least one valid CPSU Main Campus course" });
  }

  const admin = await getAccessUser(req.user!.userId);
  if (!admin || !normalizedCourses.every((selectedCourse) => canManageCourse(admin, selectedCourse))) {
    return res.status(403).json({ success: false, message: "You are not assigned to manage this course" });
  }

  if (
    new Date(endDate) <= new Date(startDate)
  ) {
    return res.status(400).json({
      success: false,
      message:
        "End date must be after start date",
    });
  }

  const election = await Election.create({
    title,
    description,
    academicYear,
    course: normalizedCourses[0],
    courses: normalizedCourses,
    startDate,
    endDate,
    createdBy: req.user!.userId,
    status: "DRAFT",
    approvalStatus: isSuperAdmin(admin) ? "APPROVED" : "NOT_SUBMITTED",
    approvedBy: isSuperAdmin(admin) ? req.user!.userId : undefined,
    approvedAt: isSuperAdmin(admin) ? new Date() : undefined,
    resultsPublished: false,
  });

  await createAuditLog({
    userId: req.user?.userId,
    action: "ELECTION_CREATED",
    resource: "Election",
    resourceId: election._id.toString(),
    description:
      `Created election "${election.title}"`,
    ipAddress: req.ip,
  });

  return res.status(201).json({
    success: true,
    data: election,
  });
}

export async function openElection(
  req: AuthRequest,
  res: Response,
) {
  const election = await Election.findById(
    req.params.id,
  );

  if (!election) {
    return res.status(404).json({
      success: false,
      message: "Election not found",
    });
  }

  if (!(await canManageElection(req, election))) {
    return res.status(403).json({ success: false, message: "You are not assigned to manage this course" });
  }

  const admin = await getAccessUser(req.user!.userId);
  if (!admin || (!isSuperAdmin(admin) && election.approvalStatus !== "APPROVED")) {
    return res.status(403).json({ success: false, message: "This election must be approved by the Super Admin before voting can open" });
  }

  if (
    election.status !== "DRAFT" &&
    election.status !== "SCHEDULED"
  ) {
    return res.status(400).json({
      success: false,
      message: "Election cannot be opened",
    });
  }

  const votingWindow = getVotingWindowState(election);
  if (votingWindow === "ENDED" || votingWindow === "INVALID") {
    election.status = "CLOSED";
    await election.save();
    return res.status(400).json({
      success: false,
      message: "This election's end time has already passed and it cannot be opened.",
    });
  }

  election.status = votingWindow === "NOT_STARTED" ? "SCHEDULED" : "ACTIVE";

  await election.save();

  return res.json({
    success: true,
    message: votingWindow === "NOT_STARTED"
      ? "Election is scheduled and will open automatically at its start time"
      : "Election is now active",
    data: election,
  });
}

export async function closeElection(
  req: AuthRequest,
  res: Response,
) {
  const election = await Election.findById(
    req.params.id,
  );

  if (!election) {
    return res.status(404).json({
      success: false,
      message: "Election not found",
    });
  }

  if (!(await canManageElection(req, election))) {
    return res.status(403).json({ success: false, message: "You are not assigned to manage this course" });
  }

  if (election.status !== "ACTIVE") {
    return res.status(400).json({
      success: false,
      message:
        "Only active elections can be closed",
    });
  }

  election.status = "CLOSED";

  await election.save();

  return res.json({
    success: true,
    message: "Election closed",
    data: election,
  });
}

export async function publishResults(
  req: AuthRequest,
  res: Response,
) {
  const election =
    await Election.findById(
      req.params.id,
    );

  if (!election) {
    return res.status(404).json({
      success: false,
      message: "Election not found",
    });
  }

  if (!(await canManageElection(req, election))) {
    return res.status(403).json({ success: false, message: "You are not assigned to manage this course" });
  }

  if (
    election.status !==
    "CLOSED"
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Election must be closed before publishing results",
    });
  }

  election.status =
    "RESULTS_PUBLISHED";

  election.resultsPublished =
    true;

  await election.save();

  return res.json({
    success: true,
    message:
      "Results published",
    data: election,
  });
}

export async function updateElection(
  req: AuthRequest,
  res: Response,
) {
  const election = await Election.findById(req.params.id);

  if (!election) {
    return res.status(404).json({ success: false, message: "Election not found" });
  }

  if (!(await canManageElection(req, election))) {
    return res.status(403).json({ success: false, message: "You are not assigned to manage this course" });
  }

  if (!["DRAFT", "SCHEDULED"].includes(election.status)) {
    return res.status(400).json({ success: false, message: "Only draft or scheduled elections can be edited" });
  }

  const { title, description, course, courses, academicYear, startDate, endDate } = req.body;
  const normalizedCourses = requestedElectionCourses(courses, course ?? electionCourseCodes(election));
  if (!normalizedCourses.length || normalizedCourses.some((selectedCourse) => !isKnownCourse(selectedCourse))) {
    return res.status(400).json({ success: false, message: "Select at least one valid CPSU Main Campus course" });
  }
  const admin = await getAccessUser(req.user!.userId);
  if (!admin || !normalizedCourses.every((selectedCourse) => canManageCourse(admin, selectedCourse))) {
    return res.status(403).json({ success: false, message: "You are not assigned to manage this course" });
  }
  if (new Date(endDate) <= new Date(startDate)) {
    return res.status(400).json({ success: false, message: "End date must be after start date" });
  }

  election.title = title;
  election.description = description;
  election.course = normalizedCourses[0];
  election.courses = normalizedCourses;
  election.academicYear = academicYear;
  election.startDate = startDate;
  election.endDate = endDate;
  if (!isSuperAdmin(admin)) {
    if (election.status === "SCHEDULED") election.status = "DRAFT";
    clearElectionApproval(election);
  }
  await election.save();

  await createAuditLog({
    userId: req.user?.userId,
    action: "ELECTION_UPDATED",
    resource: "Election",
    resourceId: election._id.toString(),
    description: `Updated election "${election.title}"`,
    ipAddress: req.ip,
  });

  return res.json({ success: true, data: election });
}

export async function scheduleElection(
  req: AuthRequest,
  res: Response,
) {
  const election = await Election.findById(req.params.id);
  if (!election) return res.status(404).json({ success: false, message: "Election not found" });
  if (!(await canManageElection(req, election))) return res.status(403).json({ success: false, message: "You are not assigned to manage this course" });
  if (election.status !== "DRAFT") return res.status(400).json({ success: false, message: "Only draft elections can be scheduled" });
  const admin = await getAccessUser(req.user!.userId);
  if (!admin || (!isSuperAdmin(admin) && election.approvalStatus !== "APPROVED")) {
    return res.status(403).json({ success: false, message: "This election must be approved by the Super Admin before it can be scheduled" });
  }
  election.status = "SCHEDULED";
  await election.save();
  return res.json({ success: true, message: "Election scheduled", data: election });
}

export async function requestElectionApproval(
  req: AuthRequest,
  res: Response,
) {
  const election = await Election.findById(req.params.id);
  if (!election) return res.status(404).json({ success: false, message: "Election not found" });

  const admin = await getAccessUser(req.user!.userId);
  if (!admin || !canManageCourse(admin, electionCourseCodes(election))) {
    return res.status(403).json({ success: false, message: "You are not assigned to manage this course" });
  }
  if (isSuperAdmin(admin)) {
    return res.status(400).json({ success: false, message: "Super Admin elections do not require approval" });
  }
  if (election.status !== "DRAFT") {
    return res.status(400).json({ success: false, message: "Only draft elections can be submitted for approval" });
  }
  if (election.approvalStatus === "PENDING") {
    return res.status(400).json({ success: false, message: "This election is already waiting for approval" });
  }

  election.approvalStatus = "PENDING";
  election.approvalRequestedAt = new Date();
  election.approvedBy = undefined;
  election.approvedAt = undefined;
  election.rejectionReason = undefined;
  await election.save();

  await createAuditLog({
    userId: req.user?.userId,
    action: "ELECTION_APPROVAL_REQUESTED",
    resource: "Election",
    resourceId: election._id.toString(),
    description: `Submitted election "${election.title}" for Super Admin approval`,
    ipAddress: req.ip,
  });

  return res.json({ success: true, message: "Election submitted for Super Admin approval", data: election });
}

export async function approveElection(
  req: AuthRequest,
  res: Response,
) {
  const election = await Election.findById(req.params.id);
  if (!election) return res.status(404).json({ success: false, message: "Election not found" });

  const admin = await getAccessUser(req.user!.userId);
  if (!admin || !isSuperAdmin(admin)) {
    return res.status(403).json({ success: false, message: "Only the Super Admin can approve elections" });
  }
  if (election.status !== "DRAFT" || election.approvalStatus !== "PENDING") {
    return res.status(400).json({ success: false, message: "Only pending draft elections can be approved" });
  }

  election.approvalStatus = "APPROVED";
  election.approvedBy = req.user!.userId as any;
  election.approvedAt = new Date();
  election.rejectionReason = undefined;
  await election.save();

  await createAuditLog({
    userId: req.user?.userId,
    action: "ELECTION_APPROVED",
    resource: "Election",
    resourceId: election._id.toString(),
    description: `Approved election "${election.title}" for ${electionCourseCodes(election).join(", ")}`,
    ipAddress: req.ip,
  });

  return res.json({ success: true, message: "Election approved. The course moderator can now schedule or open voting.", data: election });
}

export async function rejectElection(
  req: AuthRequest,
  res: Response,
) {
  const election = await Election.findById(req.params.id);
  if (!election) return res.status(404).json({ success: false, message: "Election not found" });

  const admin = await getAccessUser(req.user!.userId);
  if (!admin || !isSuperAdmin(admin)) {
    return res.status(403).json({ success: false, message: "Only the Super Admin can reject elections" });
  }
  if (election.status !== "DRAFT" || election.approvalStatus !== "PENDING") {
    return res.status(400).json({ success: false, message: "Only pending draft elections can be rejected" });
  }

  election.approvalStatus = "REJECTED";
  election.rejectionReason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "Changes are required before approval";
  await election.save();

  await createAuditLog({
    userId: req.user?.userId,
    action: "ELECTION_REJECTED",
    resource: "Election",
    resourceId: election._id.toString(),
    description: `Requested changes to election "${election.title}"`,
    ipAddress: req.ip,
  });

  return res.json({ success: true, message: "Election returned to the course moderator for changes", data: election });
}

export async function cancelElection(
  req: AuthRequest,
  res: Response,
) {
  const election = await Election.findById(req.params.id);
  if (!election) return res.status(404).json({ success: false, message: "Election not found" });
  if (!(await canManageElection(req, election))) return res.status(403).json({ success: false, message: "You are not assigned to manage this course" });
  if (!["DRAFT", "SCHEDULED", "CLOSED"].includes(election.status)) return res.status(400).json({ success: false, message: "Election cannot be cancelled in its current state" });
  election.status = "CANCELLED";
  await election.save();
  return res.json({ success: true, message: "Election cancelled", data: election });
}

export async function deleteElection(
  req: AuthRequest,
  res: Response,
) {
  const election = await Election.findById(req.params.id);
  if (!election) return res.status(404).json({ success: false, message: "Election not found" });
  if (!(await canManageElection(req, election))) return res.status(403).json({ success: false, message: "You are not assigned to manage this course" });
  if (election.resultsPublished || election.status === "RESULTS_PUBLISHED") {
    return res.status(400).json({ success: false, message: "Published elections cannot be deleted" });
  }
  if (election.status === "ACTIVE") {
    return res.status(400).json({ success: false, message: "Active elections must be closed before they can be deleted" });
  }
  const deletedTitle = election.title;
  const deletedId = election._id.toString();
  await Promise.all([
    Candidate.deleteMany({ electionId: election._id }),
    Position.deleteMany({ electionId: election._id }),
    VoteSelection.deleteMany({ electionId: election._id }),
    Vote.deleteMany({ electionId: election._id }),
    election.deleteOne(),
  ]);
  await createAuditLog({
    userId: req.user?.userId,
    action: "ELECTION_DELETED",
    resource: "Election",
    resourceId: deletedId,
    description: `Deleted unpublished election "${deletedTitle}"`,
    ipAddress: req.ip,
  });
  return res.json({ success: true, message: "Election deleted" });
}
