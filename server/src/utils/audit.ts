import mongoose from "mongoose";
import { AuditLog } from "../models/AuditLog.js";

interface AuditOptions {
  userId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  description: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}

export async function createAuditLog(
  options: AuditOptions,
) {
  await AuditLog.create({
    userId: options.userId
      ? new mongoose.Types.ObjectId(
          options.userId,
        )
      : undefined,

    action: options.action,

    resource: options.resource,

    resourceId: options.resourceId
      ? new mongoose.Types.ObjectId(
          options.resourceId,
        )
      : undefined,

    description:
      options.description,

    ipAddress:
      options.ipAddress,

    metadata:
      options.metadata,
  });
}