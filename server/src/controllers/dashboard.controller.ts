import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { Election } from "../models/Election.js";
import { Vote } from "../models/Vote.js";

export async function getAdminDashboard(
  _req: AuthRequest,
  res: Response,
) {
  const [
    totalVoters,
    activeElections,
    completedElections,
    totalVotes,
  ] = await Promise.all([
    User.countDocuments({
      role: "VOTER",
      isActive: true,
    }),

    Election.countDocuments({
      status: "ACTIVE",
    }),

    Election.countDocuments({
      $in: [
        "CLOSED",
        "RESULTS_PUBLISHED",
      ],
    }),

    Vote.countDocuments(),
  ]);

  const activeElection =
    await Election.findOne({
      status: "ACTIVE",
    });

  let electionVotes = 0;

  if (activeElection) {
    electionVotes =
      await Vote.countDocuments({
        electionId:
          activeElection._id,
      });
  }

  const voterTurnout =
    totalVoters > 0
      ? (electionVotes /
          totalVoters) *
        100
      : 0;

  return res.json({
    success: true,
    data: {
      totalVoters,
      activeElections,
      completedElections,
      totalVotes,
      voterTurnout,
    },
  });
}