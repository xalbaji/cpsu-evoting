import mongoose, { Document, Schema } from "mongoose";

export interface IVote extends Document {
  electionId: mongoose.Types.ObjectId;
  voterId: mongoose.Types.ObjectId;
  voteReference: string;
  submittedAt: Date;
}

const voteSchema = new Schema<IVote>(
  {
    electionId: {
      type: Schema.Types.ObjectId,
      ref: "Election",
      required: true,
      index: true,
    },

    voterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    voteReference: {
      type: String,
      required: true,
      unique: true,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

voteSchema.index(
  {
    electionId: 1,
    voterId: 1,
  },
  {
    unique: true,
  },
);

export const Vote = mongoose.model<IVote>(
  "Vote",
  voteSchema,
);