import { Response } from "express";
import { QueryFilter } from "mongoose";
import { AuthRequest } from "../middleware/auth.js";
import { Election } from "../models/Election.js";
import { Position } from "../models/Position.js";
import { Candidate } from "../models/Candidate.js";
import { IUser, User } from "../models/User.js";
import { Vote } from "../models/Vote.js";
import { VoteSelection } from "../models/VoteSelection.js";
import { getAccessUser, canManageCourse, courseMatches, electionCourseCodes } from "../utils/courseAccess.js";

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

  const user = await getAccessUser(req.user!.userId);
  const canAccess = user && (
    user.role === "ADMIN"
      ? canManageCourse(user, electionCourseCodes(election))
      : user.role === "VOTER" && courseMatches(user.course, electionCourseCodes(election))
  );
  if (!canAccess) {
    return res.status(403).json({ success: false, message: "This election is not available for your course." });
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

  const selectedCourses = electionCourseCodes(election);
  const registeredVoterFilter: QueryFilter<IUser> = {
    role: { $in: ["VOTER", "ADMIN"] as IUser["role"][] },
    isActive: true,
    course: { $in: selectedCourses },
  };

  const [registeredByCourse, votedByCourse, registeredVoterIds, submittedBallotCount] = await Promise.all([
    User.aggregate([
      { $match: registeredVoterFilter },
      {
        $group: {
          _id: "$course",
          registeredVoters: { $sum: 1 },
        },
      },
    ]),
    Vote.aggregate([
      { $match: { electionId: election._id } },
      {
        $lookup: {
          from: "users",
          localField: "voterId",
          foreignField: "_id",
          as: "voter",
        },
      },
      { $unwind: "$voter" },
      {
        $match: {
          "voter.role": { $in: ["VOTER", "ADMIN"] },
          "voter.isActive": true,
          "voter.course": { $in: selectedCourses },
        },
      },
      {
        $group: {
          _id: "$voter.course",
          votedVoters: { $sum: 1 },
        },
      },
    ]),
    User.find(registeredVoterFilter).distinct("_id"),
    Vote.countDocuments({ electionId: election._id }),
  ]);

  const eligibleVoteIds = await Vote.distinct("_id", {
    electionId: election._id,
    voterId: { $in: registeredVoterIds },
  });
  const totalVotes = eligibleVoteIds.length;
  const excludedBallotCount = Math.max(submittedBallotCount - totalVotes, 0);

  const voteCounts =
    await VoteSelection.aggregate([
      {
        $match: {
          electionId: election._id,
          voteId: { $in: eligibleVoteIds },
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

  const registeredMap = new Map(
    registeredByCourse.map((row) => [String(row._id), row.registeredVoters as number]),
  );
  const votedMap = new Map(
    votedByCourse.map((row) => [String(row._id), row.votedVoters as number]),
  );
  const courseVoterBreakdown = selectedCourses.map((course) => {
    const registeredVoters = registeredMap.get(course) ?? 0;
    const votedVoters = votedMap.get(course) ?? 0;

    return {
      course,
      registeredVoters,
      votedVoters,
      remainingVoters: Math.max(registeredVoters - votedVoters, 0),
      turnoutPercentage: registeredVoters > 0 ? (votedVoters / registeredVoters) * 100 : 0,
    };
  });
  const totalRegisteredVoters = courseVoterBreakdown.reduce((sum, item) => sum + item.registeredVoters, 0);
  const totalVotedVoters = courseVoterBreakdown.reduce((sum, item) => sum + item.votedVoters, 0);
  const remainingVoters = Math.max(totalRegisteredVoters - totalVotedVoters, 0);

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

      const highestVoteTotal = positionCandidates[0]?.votes ?? 0;
      const tiedLeaders = highestVoteTotal > 0
        ? positionCandidates.filter((candidate) => candidate.votes === highestVoteTotal)
        : [];

      return {
        position,
        candidates:
          positionCandidates,
        // A winner must have the sole highest vote total. Equal totals are a tie.
        winner: tiedLeaders.length === 1 ? tiedLeaders[0] : null,
        isTie: tiedLeaders.length > 1,
      };
    },
  );

  return res.json({
    success: true,
    data: {
      election,
      totalVotes,
      submittedBallotCount,
      voterSummary: {
        courses: courseVoterBreakdown,
        totalRegisteredVoters,
        totalVotedVoters,
        remainingVoters,
        turnoutPercentage: totalRegisteredVoters > 0
          ? (totalVotedVoters / totalRegisteredVoters) * 100
          : 0,
        ballotCountMatchesVoterCount: totalVotes === totalVotedVoters,
        allRegisteredVotersVoted: totalRegisteredVoters > 0 && totalRegisteredVoters === totalVotedVoters,
        excludedBallotCount,
      },
      results,
    },
  });
}
