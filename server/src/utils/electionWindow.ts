import { Election } from "../models/Election.js";

type TimedElection = {
  startDate: Date | string;
  endDate: Date | string;
};

export type VotingWindowState = "OPEN" | "NOT_STARTED" | "ENDED" | "INVALID";

export function getVotingWindowState(
  election: TimedElection,
  now = new Date(),
): VotingWindowState {
  const startAt = new Date(election.startDate).getTime();
  const endAt = new Date(election.endDate).getTime();

  if (!Number.isFinite(startAt) || !Number.isFinite(endAt) || endAt <= startAt) {
    return "INVALID";
  }

  const currentTime = now.getTime();
  if (currentTime < startAt) return "NOT_STARTED";
  if (currentTime >= endAt) return "ENDED";
  return "OPEN";
}

export function votingWindowMessage(state: VotingWindowState): string {
  switch (state) {
    case "NOT_STARTED":
      return "Voting has not started yet.";
    case "ENDED":
      return "Voting has ended at the scheduled closing time. No more votes can be submitted.";
    default:
      return "This election has an invalid voting schedule.";
  }
}

/**
 * Keeps persisted election statuses aligned with their configured dates. The
 * vote controller also enforces the same cutoff, so the deadline remains
 * secure even if this process is delayed or restarted.
 */
export async function syncElectionStatuses(now = new Date()) {
  await Election.updateMany(
    {
      status: { $in: ["SCHEDULED", "ACTIVE"] },
      endDate: { $lte: now },
    },
    { $set: { status: "CLOSED" } },
  );

  await Election.updateMany(
    {
      status: "SCHEDULED",
      startDate: { $lte: now },
      endDate: { $gt: now },
    },
    { $set: { status: "ACTIVE" } },
  );
}

export async function closeElectionIfExpired(electionId: string, now = new Date()) {
  await Election.updateOne(
    {
      _id: electionId,
      status: { $in: ["SCHEDULED", "ACTIVE"] },
      endDate: { $lte: now },
    },
    { $set: { status: "CLOSED" } },
  );
}
