import mongoose, { Document, Schema } from "mongoose";

export type ElectionStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "ACTIVE"
  | "CLOSED"
  | "RESULTS_PUBLISHED"
  | "CANCELLED";

export type ElectionApprovalStatus =
  | "NOT_SUBMITTED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export interface IElection extends Document {
  title: string;
  description: string;
  course: string;
  courses: string[];
  academicYear: string;
  startDate: Date;
  endDate: Date;
  status: ElectionStatus;
  approvalStatus: ElectionApprovalStatus;
  approvalRequestedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  createdBy: mongoose.Types.ObjectId;
  resultsPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const electionSchema = new Schema<IElection>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    course: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    // `course` remains as the first/primary course for backwards compatibility
    // with existing records and clients. New elections keep every selected
    // course here so voter access can match any assigned program.
    courses: {
      type: [String],
      default: [],
      index: true,
    },

    academicYear: {
      type: String,
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "DRAFT",
        "SCHEDULED",
        "ACTIVE",
        "CLOSED",
        "RESULTS_PUBLISHED",
        "CANCELLED",
      ],
      default: "DRAFT",
    },

    approvalStatus: {
      type: String,
      enum: ["NOT_SUBMITTED", "PENDING", "APPROVED", "REJECTED"],
      default: "NOT_SUBMITTED",
      index: true,
    },

    approvalRequestedAt: {
      type: Date,
    },

    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    approvedAt: {
      type: Date,
    },

    rejectionReason: {
      type: String,
      trim: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    resultsPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const Election = mongoose.model<IElection>(
  "Election",
  electionSchema,
);
