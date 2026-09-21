import type { IElection } from "../models/Election.js";

export function clearElectionApproval(election: IElection) {
  election.approvalStatus = "NOT_SUBMITTED";
  election.approvalRequestedAt = undefined;
  election.approvedBy = undefined;
  election.approvedAt = undefined;
  election.rejectionReason = undefined;
}
