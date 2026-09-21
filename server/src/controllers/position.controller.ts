import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { Election } from "../models/Election.js";
import { Position } from "../models/Position.js";
import { Candidate } from "../models/Candidate.js";
import { canManageCourse, courseMatches, electionCourseCodes, getAccessUser, isElectionVisibleToVoters, isSuperAdmin } from "../utils/courseAccess.js";
import { clearElectionApproval } from "../utils/electionApproval.js";

async function canAccessElection(req: AuthRequest, election: { course?: unknown; courses?: unknown; status?: string }) {
  const user = await getAccessUser(req.user!.userId);
  if (!user) return false;
  const targetCourses = electionCourseCodes(election);
  if (user.role === "ADMIN") return canManageCourse(user, targetCourses);
  return user.role === "VOTER" && isElectionVisibleToVoters(election.status) && courseMatches(user.course, targetCourses);
}

async function resetApprovalAfterEdit(req: AuthRequest, election: any) {
  const user = await getAccessUser(req.user!.userId);
  if (!user || user.role !== "ADMIN" || isSuperAdmin(user)) return;
  if (election.status === "SCHEDULED") election.status = "DRAFT";
  clearElectionApproval(election);
  await election.save();
}

export async function getPositions(
  req: AuthRequest,
  res: Response,
) {
  const election = await Election.findById(req.params.electionId).select("course courses status");
  if (!election) return res.status(404).json({ success: false, message: "Election not found" });
  if (!(await canAccessElection(req, election))) return res.status(403).json({ success: false, message: "This election is not available for your course." });

  const positions = await Position.find({
    electionId: req.params.electionId,
  }).sort({ order: 1 });

  return res.json({
    success: true,
    data: positions,
  });
}

export async function createPosition(
  req: AuthRequest,
  res: Response,
) {
  const election = await Election.findById(
    req.params.electionId,
  );

  if (!election) {
    return res.status(404).json({
      success: false,
      message: "Election not found",
    });
  }

  if (!(await canAccessElection(req, election))) return res.status(403).json({ success: false, message: "You are not assigned to manage this course" });

  if (
    !["DRAFT", "SCHEDULED"].includes(
      election.status,
    )
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Positions can only be changed before voting",
    });
  }

  const position = await Position.create({
    electionId: election._id,
    name: req.body.name,
    description: req.body.description,
    order: req.body.order ?? 0,
    votingType:
      req.body.votingType ?? "SINGLE",
    maxSelections:
      req.body.maxSelections ?? 1,
  });

  await resetApprovalAfterEdit(req, election);

  return res.status(201).json({
    success: true,
    data: position,
  });
}

export async function updatePosition(req: AuthRequest, res: Response) {
  const position = await Position.findById(req.params.id);
  if (!position) return res.status(404).json({ success: false, message: "Position not found" });
  const election = await Election.findById(position.electionId);
  if (election && !(await canAccessElection(req, election))) return res.status(403).json({ success: false, message: "You are not assigned to manage this course" });
  if (!election || !["DRAFT", "SCHEDULED"].includes(election.status)) return res.status(400).json({ success: false, message: "Positions can only be changed before voting" });
  const { name, description, order, votingType, maxSelections } = req.body;
  Object.assign(position, { name, description, order, votingType, maxSelections });
  await position.save();
  if (election) await resetApprovalAfterEdit(req, election);
  return res.json({ success: true, data: position });
}

export async function deletePosition(req: AuthRequest, res: Response) {
  const position = await Position.findById(req.params.id);
  if (!position) return res.status(404).json({ success: false, message: "Position not found" });
  const election = await Election.findById(position.electionId);
  if (election && !(await canAccessElection(req, election))) return res.status(403).json({ success: false, message: "You are not assigned to manage this course" });
  if (!election || !["DRAFT", "SCHEDULED"].includes(election.status)) return res.status(400).json({ success: false, message: "Positions can only be changed before voting" });
  await Candidate.deleteMany({ positionId: position._id });
  await position.deleteOne();
  await resetApprovalAfterEdit(req, election);
  return res.json({ success: true, message: "Position deleted" });
}
