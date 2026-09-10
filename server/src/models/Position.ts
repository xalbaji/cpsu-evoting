import mongoose, { Document, Schema } from "mongoose";

export type VotingType = "SINGLE" | "MULTIPLE";

export interface IPosition extends Document {
  electionId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  order: number;
  votingType: VotingType;
  maxSelections: number;
}

const positionSchema = new Schema<IPosition>(
  {
    electionId: {
      type: Schema.Types.ObjectId,
      ref: "Election",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: String,

    order: {
      type: Number,
      default: 0,
    },

    votingType: {
      type: String,
      enum: ["SINGLE", "MULTIPLE"],
      default: "SINGLE",
    },

    maxSelections: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  {
    timestamps: true,
  },
);

positionSchema.index({
  electionId: 1,
  name: 1,
});

export const Position = mongoose.model<IPosition>(
  "Position",
  positionSchema,
);