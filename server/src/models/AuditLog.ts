import mongoose, { Document, Schema } from "mongoose";

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId;
  action: string;
  resource?: string;
  resourceId?: mongoose.Types.ObjectId;
  description: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
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
  },
  {
    timestamps: true,
  },
);

export const AuditLog = mongoose.model<IAuditLog>(
  "AuditLog",
  auditLogSchema,
);