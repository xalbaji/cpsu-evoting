import mongoose, { Document, Schema } from "mongoose";

export type ElectionStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "ACTIVE"
  | "CLOSED"
  | "RESULTS_PUBLISHED"
  | "CANCELLED";

export interface IElection extends Document {
  title: string;
  description: string;
  academicYear: string;
  startDate: Date;
  endDate: Date;
  status: ElectionStatus;
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