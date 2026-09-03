import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { Election } from "../models/Election.js";
import { Position } from "../models/Position.js";

export async function getPositions(
  req: AuthRequest,
  res: Response,
) {
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

  return res.status(201).json({
    success: true,
    data: position,
  });
}