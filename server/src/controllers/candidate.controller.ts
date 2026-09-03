import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { Candidate } from "../models/Candidate.js";
import { Election } from "../models/Election.js";
import { Position } from "../models/Position.js";

export async function getCandidates(
  req: AuthRequest,
  res: Response,
) {
  const filter: Record<string, unknown> = {
    electionId: req.params.electionId,
  };
  if (req.user?.role !== "ADMIN") {
    filter.isActive = true;
  }

  const candidates = await Candidate.find(filter);

  return res.json({
    success: true,
    data: candidates,
  });
}

export async function createCandidate(
  req: AuthRequest,
  res: Response,
) {
  const {
    electionId,
    positionId,
    candidateNumber,
    firstName,
    lastName,
    photoUrl,
    course,
    yearLevel,
    party,
    biography,
  } = req.body;

  const election =
    await Election.findById(electionId);

  if (!election) {
    return res.status(404).json({
      success: false,
      message: "Election not found",
    });
  }

  const position =
    await Position.findOne({
      _id: positionId,
      electionId,
    });

  if (!position) {
    return res.status(404).json({
      success: false,
      message: "Position not found",
    });
  }

  if (!["DRAFT", "SCHEDULED"].includes(election.status)) {
    return res.status(400).json({
      success: false,
      message: "Candidates can only be changed before voting",
    });
  }

  const candidate =
    await Candidate.create({
      electionId,
      positionId,
      candidateNumber,
      firstName,
      lastName,
      photoUrl,
      course,
      yearLevel,
      party,
      biography,
    });

  return res.status(201).json({
    success: true,
    data: candidate,
  });
}

export async function getCandidate(req: AuthRequest, res: Response) {
  const candidate = await Candidate.findById(req.params.id);
  if (!candidate) return res.status(404).json({ success: false, message: "Candidate not found" });
  return res.json({ success: true, data: candidate });
}

export async function updateCandidate(req: AuthRequest, res: Response) {
  const candidate = await Candidate.findById(req.params.id);
  if (!candidate) return res.status(404).json({ success: false, message: "Candidate not found" });
  const election = await Election.findById(candidate.electionId);
  if (!election || !["DRAFT", "SCHEDULED"].includes(election.status)) return res.status(400).json({ success: false, message: "Candidates can only be changed before voting" });
  const fields = ["candidateNumber", "firstName", "lastName", "photoUrl", "course", "yearLevel", "party", "biography", "isActive", "positionId"];
  if (req.body.positionId) {
    const position = await Position.findOne({
      _id: req.body.positionId,
      electionId: candidate.electionId,
    });
    if (!position) return res.status(400).json({ success: false, message: "Position not found" });
  }
  for (const field of fields) {
    if (field in req.body) (candidate as any)[field] = req.body[field];
  }
  await candidate.save();
  return res.json({ success: true, data: candidate });
}

export async function deleteCandidate(req: AuthRequest, res: Response) {
  const candidate = await Candidate.findById(req.params.id);
  if (!candidate) return res.status(404).json({ success: false, message: "Candidate not found" });
  const election = await Election.findById(candidate.electionId);
  if (!election || !["DRAFT", "SCHEDULED"].includes(election.status)) return res.status(400).json({ success: false, message: "Candidates can only be changed before voting" });
  await candidate.deleteOne();
  return res.json({ success: true, message: "Candidate deleted" });
}