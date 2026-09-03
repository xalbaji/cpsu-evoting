import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { Candidate } from "../models/Candidate.js";
import { Election } from "../models/Election.js";
import { Position } from "../models/Position.js";

export async function getCandidates(
  req: AuthRequest,
  res: Response,
) {
  const candidates = await Candidate.find({
    electionId: req.params.electionId,
    isActive: true,
  });

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