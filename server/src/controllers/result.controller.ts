import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { Election } from "../models/Election.js";
import { Position } from "../models/Position.js";
import { Candidate } from "../models/Candidate.js";
import { Vote } from "../models/Vote.js";
import { VoteSelection } from "../models/VoteSelection.js";

export async function getResults(
  req: AuthRequest,
  res: Response,
) {
  const election =
    await Election.findById(
      req.params.electionId,
    );

  if (!election) {
    return res.status(404).json({
      success: false,
      message: "Election not found",
    });
  }

  if (
    !election.resultsPublished &&
    req.user?.role !== "ADMIN"
  ) {
    return res.status(403).json({
      success: false,
      message:
        "Results have not been published",
    });
  }

  const positions =
    await Position.find({
      electionId: election._id,
    }).sort({ order: 1 });

  const candidates =
    await Candidate.find({
      electionId: election._id,
    });

  const voteCounts =
    await VoteSelection.aggregate([
      {
        $match: {
          electionId:
            election._id,
        },
      },
      {
        $group: {
          _id: "$candidateId",
          votes: {
            $sum: 1,
          },
        },
      },
    ]);

  const countMap = new Map(
    voteCounts.map((item) => [
      item._id.toString(),
      item.votes,
    ]),
  );

  const totalVotes =
    await Vote.countDocuments({
      electionId: election._id,
    });

  const results = positions.map(
    (position) => {
      const positionCandidates =
        candidates
          .filter(
            (candidate) =>
              candidate.positionId.toString() ===
              position._id.toString(),
          )
          .map((candidate) => {
            const votes =
              countMap.get(
                candidate._id.toString(),
              ) ?? 0;

            return {
              candidate,
              votes,
              percentage:
                totalVotes > 0
                  ? (votes /
                      totalVotes) *
                    100
                  : 0,
            };
          })
          .sort(
            (a, b) =>
              b.votes - a.votes,
          );

      return {
        position,
        candidates:
          positionCandidates,
        winner:
          positionCandidates[0] ?? null,
      };
    },
  );

  return res.json({
    success: true,
    data: {
      election,
      totalVotes,
      results,
    },
  });
}