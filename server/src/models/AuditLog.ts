import mongoose, { Document, Schema } from "mongoose";

export type AuditAudience = "ADMIN" | "VOTER";

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId;
  action: string;
  resource?: string;
  resourceId?: mongoose.Types.ObjectId;
  description: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
  audience: AuditAudience;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    action: {
      type: String,
      required: true,
      index: true,
    },

    resource: String,

    resourceId: Schema.Types.ObjectId,

    description: {
      type: String,
      required: true,
    },

    ipAddress: String,

    metadata: Schema.Types.Mixed,

    // Voter activity is kept separate from the administrative stream so
    // system-wide audit viewers never see private ballot activity.
    audience: {
      type: String,
      enum: ["ADMIN", "VOTER"],
      default: "ADMIN",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

export const AuditLog = mongoose.model<IAuditLog>(
  "AuditLog",
  auditLogSchema,
);
