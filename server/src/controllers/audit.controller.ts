import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { AuditLog } from "../models/AuditLog.js";
import { Vote } from "../models/Vote.js";
import { getAccessUser, isSuperAdmin } from "../utils/courseAccess.js";

function searchFilter(search: string): Record<string, unknown> | null {
  if (!search) return null;
  return {
    $or: [
      { action: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { resource: { $regex: search, $options: "i" } },
    ],
  };
}

export async function getAuditLogs(req: AuthRequest, res: Response) {
  const search = String(req.query.search ?? "").trim();
  const admin = await getAccessUser(req.user!.userId);
  if (!admin) {
    return res.status(401).json({ success: false, message: "Account not found" });
  }

  // Super Admin sees the full administrative stream. Course moderators see
  // only activity performed by their own account, including their own vote
  // receipts, never another moderator's entries.
  const scopeFilter: Record<string, unknown> = isSuperAdmin(admin)
    ? { audience: { $ne: "VOTER" } }
    : { userId: req.user!.userId };
  const queryFilter = searchFilter(search);
  const filter = queryFilter ? { $and: [scopeFilter, queryFilter] } : scopeFilter;
  const logs = await AuditLog.find(filter)
    .populate("userId", "firstName lastName email")
    .sort({ createdAt: -1 })
    .limit(200);

  return res.json({ success: true, data: logs });
}

export async function getMyAuditLogs(req: AuthRequest, res: Response) {
  const search = String(req.query.search ?? "").trim();
  const queryFilter = searchFilter(search);
  const scopeFilter: Record<string, unknown> = {
    userId: req.user!.userId,
    audience: "VOTER",
  };
  const filter = queryFilter ? { $and: [scopeFilter, queryFilter] } : scopeFilter;
  const [logs, votes] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).limit(200).lean(),
    Vote.find({ voterId: req.user!.userId })
      .populate("electionId", "title")
      .sort({ submittedAt: -1 })
      .limit(200)
      .lean(),
  ]);

  const recordedVoteIds = new Set(
    logs
      .filter((log) => log.action === "VOTE_SUBMITTED" && log.resourceId)
      .map((log) => String(log.resourceId)),
  );
  const legacyVoteActivities = votes
    .filter((vote) => !recordedVoteIds.has(String(vote._id)))
    .map((vote) => {
      const election = vote.electionId as unknown as { title?: string } | null;
      return {
        _id: `vote-${vote._id.toString()}`,
        action: "VOTE_SUBMITTED",
        resource: "Vote",
        description: `Submitted a ballot for "${election?.title ?? "an election"}"`,
        createdAt: vote.submittedAt,
      };
    })
    .filter((activity) => !queryFilter || `${activity.action} ${activity.resource} ${activity.description}`.toLowerCase().includes(search.toLowerCase()));

  const combined = [...logs, ...legacyVoteActivities]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 200);

  return res.json({ success: true, data: combined });
}
