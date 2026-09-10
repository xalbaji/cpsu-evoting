import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { AuditLog } from "../models/AuditLog.js";

export async function getAuditLogs(req: AuthRequest, res: Response) {
  const search = String(req.query.search ?? "").trim();
  const filter = search
    ? {
        $or: [
          { action: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { resource: { $regex: search, $options: "i" } },
        ],
      }
    : {};
  const logs = await AuditLog.find(filter)
    .populate("userId", "firstName lastName email")
    .sort({ createdAt: -1 })
    .limit(200);

  return res.json({ success: true, data: logs });
}
