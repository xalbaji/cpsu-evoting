import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/auth.js";
import { Election } from "../models/Election.js";
import { Position } from "../models/Position.js";
import { Candidate } from "../models/Candidate.js";
import { Vote } from "../models/Vote.js";
import { VoteSelection } from "../models/VoteSelection.js";
import { User } from "../models/User.js";

async function requireVerifiedVoter(userId: string, session?: mongoose.ClientSession) {
  const query = User.findById(userId).select("isVerified isActive");
  if (session) query.session(session);
  const user = await query;

  if (!user || !user.isActive) {
    return "Your account is inactive. Contact an administrator.";
  }
  if (!user.isVerified) {
    return "Your account must be verified by an administrator before you can vote.";
  }
  return null;
}

export async function getBallot(
  req: AuthRequest,
  res: Response,
) {
  const eligibilityError = await requireVerifiedVoter(req.user!.userId);
  if (eligibilityError) {
    return res.status(403).json({
      success: false,
      message: eligibilityError,
    });
  }

  const election = await Election.findById(
    req.params.electionId,
  );

  if (!election) {
    return res.status(404).json({
      success: false,
      message: "Election not found",
    });
  }

  if (election.status !== "ACTIVE") {
    return res.status(400).json({
      success: false,
      message: "Election is not active",
    });
  }

  const existingVote = await Vote.findOne({
    electionId: election._id,
    voterId: req.user!.userId,
  });

  if (existingVote) {
    return res.status(409).json({
      success: false,
      message: "You have already voted",
    });
  }

  const positions = await Position.find({
    electionId: election._id,
  }).sort({ order: 1 });

  const candidates = await Candidate.find({
    electionId: election._id,
    isActive: true,
  });

  const ballot = positions.map((position) => ({
    id: position._id,
    name: position.name,
    description: position.description,
    votingType: position.votingType,
    maxSelections: position.maxSelections,
    candidates: candidates.filter(
      (candidate) =>
        candidate.positionId.toString() ===
        position._id.toString(),
    ),
  }));

  return res.json({
    success: true,
    data: {
      election,
      positions: ballot,
    },
  });
}

export async function submitVote(
  req: AuthRequest,
  res: Response,
) {
  const session =
    await mongoose.startSession();

  try {
    session.startTransaction();

    const eligibilityError = await requireVerifiedVoter(req.user!.userId, session);
    if (eligibilityError) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: eligibilityError,
      });
    }

    const election =
      await Election.findById(
        req.params.electionId,
      ).session(session);

    if (!election) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    if (election.status !== "ACTIVE") {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Election is not active",
      });
    }

    const existingVote =
      await Vote.findOne({
        electionId: election._id,
        voterId: req.user!.userId,
      }).session(session);

    if (existingVote) {
      await session.abortTransaction();

      return res.status(409).json({
        success: false,
        message: "You have already voted",
      });
    }

    const positions = await Position.find({
      electionId: election._id,
    }).session(session);

    const candidates =
      await Candidate.find({
        electionId: election._id,
        isActive: true,
      }).session(session);

    const selections =
      req.body.selections;

    if (
      !Array.isArray(selections)
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Invalid ballot",
      });
    }

    const positionIds = new Set(
      positions.map((position) => position._id.toString()),
    );
    if (selections.some(
      (selection: any) =>
        !selection ||
        !positionIds.has(selection.positionId) ||
        !Array.isArray(selection.candidateIds),
    )) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Invalid ballot",
      });
    }

    for (const position of positions) {
      const submitted =
        selections.find(
          (item: any) =>
            item.positionId ===
            position._id.toString(),
        );

      const candidateIds =
        submitted?.candidateIds ?? [];

      if (
        position.votingType === "SINGLE" &&
        candidateIds.length > 1
      ) {
        await session.abortTransaction();

        return res.status(400).json({
          success: false,
          message:
            `${position.name} allows only one selection`,
        });
      }

      if (
        candidateIds.length >
        position.maxSelections
      ) {
        await session.abortTransaction();

        return res.status(400).json({
          success: false,
          message:
            `${position.name} exceeds the selection limit`,
        });
      }

      for (const candidateId of candidateIds) {
        const validCandidate =
          candidates.some(
            (candidate) =>
              candidate._id.toString() ===
                candidateId &&
              candidate.positionId.toString() ===
                position._id.toString(),
          );

        if (!validCandidate) {
          await session.abortTransaction();

          return res.status(400).json({
            success: false,
            message:
              "Invalid candidate selection",
          });
        }
      }
    }

    const voteReference =
      `EV-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`;

    const [vote] =
      await Vote.create(
        [
          {
            electionId: election._id,
            voterId: req.user!.userId,
            voteReference,
            submittedAt: new Date(),
          },
        ],
        { session },
      );

    const selectionDocuments: any[] = [];

    for (const selection of selections) {
      for (const candidateId of
        selection.candidateIds ?? []) {
        selectionDocuments.push({
          voteId: vote._id,
          electionId: election._id,
          positionId:
            selection.positionId,
          candidateId,
        });
      }
    }

    if (selectionDocuments.length > 0) {
      await VoteSelection.insertMany(
        selectionDocuments,
        { session },
      );
    }

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message:
        "Vote successfully submitted",
      data: {
        voteReference,
        submittedAt: vote.submittedAt,
      },
    });
  } catch (error: any) {
    await session.abortTransaction();

    if (
      error?.code === 11000
    ) {
      return res.status(409).json({
        success: false,
        message:
          "You have already voted in this election",
      });
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Unable to submit vote",
    });
  } finally {
    await session.endSession();
  }
}

export async function getMyVoteStatus(
  req: AuthRequest,
  res: Response,
) {
  const votes = await Vote.find({
    voterId: req.user!.userId,
  })
    .populate(
      "electionId",
      "title status",
    )
    .sort({
      submittedAt: -1,
    });

  return res.json({
    success: true,
    data: votes,
  });
}
