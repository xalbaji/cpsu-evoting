import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/auth.js";
import { Election } from "../models/Election.js";
import { Position } from "../models/Position.js";
import { Candidate } from "../models/Candidate.js";
import { Vote } from "../models/Vote.js";
import { VoteSelection } from "../models/VoteSelection.js";
import { User } from "../models/User.js";
import { adminElectionFilter, canManageCourse, courseMatches, electionCourseCodes, getAccessUser } from "../utils/courseAccess.js";
import { createAuditLog } from "../utils/audit.js";
import {
  closeElectionIfExpired,
  getVotingWindowState,
  syncElectionStatuses,
  votingWindowMessage,
} from "../utils/electionWindow.js";

async function requireVotingEligibility(userId: string, session?: mongoose.ClientSession) {
  const query = User.findById(userId).select("isVerified isActive role");
  if (session) query.session(session);
  const user = await query;

  if (!user || !user.isActive) {
    return "Your account is inactive. Contact an administrator.";
  }
  // Course moderators are already trusted, active administrators. They may
  // vote for their own course without going through the student verification
  // gate; regular voters still need registrar verification.
  if (user.role !== "ADMIN" && !user.isVerified) {
    return "Your account must be verified by an administrator before you can vote.";
  }
  return null;
}

async function requireCourseAccess(userId: string, electionCourse: unknown, session?: mongoose.ClientSession) {
  const query = User.findById(userId).select("course");
  if (session) query.session(session);
  const user = await query;
  return user && courseMatches(user.course, electionCourse)
    ? null
    : "This election is only available to students in its assigned course.";
}

export async function getBallot(
  req: AuthRequest,
  res: Response,
) {
  await syncElectionStatuses();

  const eligibilityError = await requireVotingEligibility(req.user!.userId);
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

  const courseError = await requireCourseAccess(req.user!.userId, electionCourseCodes(election));
  if (courseError) {
    return res.status(403).json({ success: false, message: courseError });
  }

  const votingWindow = getVotingWindowState(election);
  if (votingWindow !== "OPEN") {
    if (votingWindow === "ENDED") await closeElectionIfExpired(election._id.toString());
    return res.status(votingWindow === "ENDED" ? 410 : 409).json({
      success: false,
      message: votingWindowMessage(votingWindow),
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
  await syncElectionStatuses();

  const session =
    await mongoose.startSession();

  try {
    session.startTransaction();

    const eligibilityError = await requireVotingEligibility(req.user!.userId, session);
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

    const courseError = await requireCourseAccess(req.user!.userId, electionCourseCodes(election), session);
    if (courseError) {
      await session.abortTransaction();
      return res.status(403).json({ success: false, message: courseError });
    }

    const votingWindow = getVotingWindowState(election);
    if (votingWindow !== "OPEN") {
      await session.abortTransaction();
      if (votingWindow === "ENDED") await closeElectionIfExpired(election._id.toString());
      return res.status(votingWindow === "ENDED" ? 410 : 409).json({
        success: false,
        message: votingWindowMessage(votingWindow),
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

    // A ballot request that began just before the deadline must still fail if
    // the configured end time passes before its transaction is committed.
    if (getVotingWindowState(election) !== "OPEN") {
      await session.abortTransaction();
      await closeElectionIfExpired(election._id.toString());
      return res.status(410).json({
        success: false,
        message: votingWindowMessage("ENDED"),
      });
    }

    await session.commitTransaction();

    // Keep the voter's private activity separate from the administrative
    // audit stream. Do not store candidate selections in this entry.
    try {
      await createAuditLog({
        userId: req.user!.userId,
        action: "VOTE_SUBMITTED",
        resource: "Vote",
        resourceId: vote._id.toString(),
        description: `Submitted a ballot for "${election.title}"`,
        ipAddress: req.ip,
        audience: "VOTER",
        metadata: { electionId: election._id.toString() },
      });
    } catch (auditError) {
      console.error("Unable to record voter activity:", auditError);
    }

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
  try {
    const votes = await Vote.find({
      voterId: req.user!.userId,
    })
      .populate(
        "electionId",
        "title status startDate endDate",
      )
      .sort({
        submittedAt: -1,
      })
      .lean();

    return res.json({
      success: true,
      data: votes,
    });
  } catch (error) {
    console.error("Unable to load voter vote history:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load your vote history. Please try again.",
    });
  }
}

export async function getMyVoteSelections(
  req: AuthRequest,
  res: Response,
) {
  try {
    // A vote document ID alone must never be enough to read another account's
    // selections, so always scope this lookup to the authenticated voter.
    const vote = await Vote.findOne({
      _id: req.params.voteId,
      voterId: req.user!.userId,
    })
      .select("_id electionId submittedAt")
      .lean();

    if (!vote) {
      return res.status(404).json({
        success: false,
        message: "Vote not found in your private ballot history.",
      });
    }

    const [election, positions, selections] = await Promise.all([
      Election.findById(vote.electionId)
        .select("_id title status startDate endDate")
        .lean(),
      Position.find({ electionId: vote.electionId })
        .select("_id name order")
        .sort({ order: 1 })
        .lean(),
      VoteSelection.find({
        voteId: vote._id,
        electionId: vote.electionId,
      })
        .select("positionId candidateId")
        .lean(),
    ]);

    const candidateIds = [...new Set(selections.map((selection) => selection.candidateId.toString()))];
    const candidates = candidateIds.length
      ? await Candidate.find({ _id: { $in: candidateIds } })
          .select("_id candidateNumber firstName lastName party course photoUrl")
          .lean()
      : [];
    const candidatesById = new Map(candidates.map((candidate) => [candidate._id.toString(), candidate]));
    const selectionsByPosition = new Map<string, string[]>();

    for (const selection of selections) {
      const positionId = selection.positionId.toString();
      const current = selectionsByPosition.get(positionId) ?? [];
      current.push(selection.candidateId.toString());
      selectionsByPosition.set(positionId, current);
    }

    return res.json({
      success: true,
      data: {
        voteId: vote._id,
        electionId: vote.electionId,
        submittedAt: vote.submittedAt,
        election: election
          ? {
              _id: election._id,
              title: election.title,
              status: election.status,
              startDate: election.startDate,
              endDate: election.endDate,
            }
          : null,
        positions: positions.map((position) => ({
          positionId: position._id,
          positionName: position.name,
          candidates: (selectionsByPosition.get(position._id.toString()) ?? []).map((candidateId) => {
            const candidate = candidatesById.get(candidateId);
            return candidate
              ? {
                  candidateId: candidate._id,
                  candidateNumber: candidate.candidateNumber,
                  name: `${candidate.firstName} ${candidate.lastName}`.trim(),
                  party: candidate.party,
                  course: candidate.course,
                  photoUrl: candidate.photoUrl,
                }
              : {
                  candidateId,
                  candidateNumber: "",
                  name: "Candidate no longer available",
                };
          }),
        })),
      },
    });
  } catch (error) {
    console.error("Unable to load private vote selections:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load your private selections. Please try again.",
    });
  }
}

export async function lookupVoteReceipt(
  req: AuthRequest,
  res: Response,
) {
  const reference = String(req.query.reference ?? "").trim().toUpperCase();
  if (!/^EV-\d+-[A-Z0-9]{6}$/.test(reference)) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid vote receipt code, such as EV-1788679217653-BZMA56.",
    });
  }

  const election = await Election.findById(req.params.electionId).select("_id title course courses");
  if (!election) {
    return res.status(404).json({ success: false, message: "Election not found" });
  }

  const admin = await getAccessUser(req.user!.userId);
  if (!admin || !canManageCourse(admin, electionCourseCodes(election))) {
    return res.status(403).json({
      success: false,
      message: "You are not assigned to manage this election.",
    });
  }

  const vote = await Vote.findOne({
    electionId: election._id,
    voteReference: reference,
  }).select("voteReference submittedAt");

  if (!vote) {
    return res.status(404).json({
      success: false,
      message: "No submitted vote was found for this election and receipt code.",
    });
  }

  // Deliberately omit voterId and selections: this confirms the receipt
  // without allowing administrators to identify how or who someone voted.
  return res.json({
    success: true,
    data: {
      voteReference: vote.voteReference,
      status: "SUBMITTED",
      submittedAt: vote.submittedAt,
      electionId: election._id,
      electionTitle: election.title,
    },
  });
}

export async function lookupVoteReceiptAcrossElections(
  req: AuthRequest,
  res: Response,
) {
  const reference = String(req.query.reference ?? "").trim().toUpperCase();
  if (!/^EV-\d+-[A-Z0-9]{6}$/.test(reference)) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid vote receipt code, such as EV-1788679217653-BZMA56.",
    });
  }

  const admin = await getAccessUser(req.user!.userId);
  if (!admin) {
    return res.status(403).json({ success: false, message: "Administrator account not found." });
  }

  // Limit automatic discovery to elections this administrator is authorized
  // to manage; the endpoint must not become an election-existence oracle.
  const elections = await Election.find(adminElectionFilter(admin))
    .select("_id title course courses")
    .lean();
  const accessibleElectionIds = elections.map((election) => election._id);
  const vote = await Vote.findOne({
    electionId: { $in: accessibleElectionIds },
    voteReference: reference,
  }).select("voteReference submittedAt electionId").lean();

  if (!vote) {
    return res.status(404).json({
      success: false,
      message: "No submitted vote was found for the elections you manage and this receipt code.",
    });
  }

  const election = elections.find((item) => item._id.toString() === vote.electionId.toString());
  if (!election) {
    return res.status(404).json({ success: false, message: "The election for this receipt is no longer available." });
  }

  return res.json({
    success: true,
    data: {
      voteReference: vote.voteReference,
      status: "SUBMITTED",
      submittedAt: vote.submittedAt,
      electionId: election._id,
      electionTitle: election.title,
    },
  });
}
