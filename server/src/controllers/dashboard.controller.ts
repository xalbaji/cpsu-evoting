import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { Election } from "../models/Election.js";
import { Vote } from "../models/Vote.js";
import { adminElectionFilter, getAccessUser, isSuperAdmin, managedCourseCodes } from "../utils/courseAccess.js";

export async function getAdminDashboard(
  req: AuthRequest,
  res: Response,
) {
  const admin = await getAccessUser(req.user!.userId);
  if (!admin) return res.status(401).json({ success: false, message: "User not found" });

  const electionFilter = adminElectionFilter(admin);
  const voterFilter: Record<string, unknown> = { role: "VOTER", isActive: true };
  if (!isSuperAdmin(admin)) voterFilter.course = { $in: managedCourseCodes(admin) };

  const [
    totalVoters,
    activeElections,
    completedElections,
    totalVotes,
  ] = await Promise.all([
    User.countDocuments(voterFilter),

    Election.countDocuments({
      ...electionFilter,
      status: "ACTIVE",
    }),

    Election.countDocuments({
      ...electionFilter,
      status: {
        $in: [
          "CLOSED",
          "RESULTS_PUBLISHED",
        ],
      },
    }),

    Election.aggregate([
      { $match: electionFilter },
      { $lookup: { from: "votes", localField: "_id", foreignField: "electionId", as: "votes" } },
      { $project: { count: { $size: "$votes" } } },
      { $group: { _id: null, total: { $sum: "$count" } } },
    ]).then(([row]) => row?.total ?? 0),
  ]);

  const activeElection =
    await Election.findOne({
      ...electionFilter,
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
