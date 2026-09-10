import mongoose, { Document, Schema } from "mongoose";

export interface ICandidate extends Document {
  electionId: mongoose.Types.ObjectId;
  positionId: mongoose.Types.ObjectId;
  candidateNumber: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  course?: string;
  yearLevel?: string;
  party?: string;
  biography?: string;
  isActive: boolean;
}

const candidateSchema = new Schema<ICandidate>(
  {
    electionId: {
      type: Schema.Types.ObjectId,
      ref: "Election",
      required: true,
      index: true,
    },

    positionId: {
      type: Schema.Types.ObjectId,
      ref: "Position",
      required: true,
      index: true,
    },

    candidateNumber: {
      type: String,
      required: true,
    },

    firstName: {
      type: String,
      required: true,
    },

    lastName: {
      type: String,
      required: true,
    },

    photoUrl: String,

    course: String,

    yearLevel: String,

    party: String,

    biography: String,

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

candidateSchema.index({
  electionId: 1,
  positionId: 1,
});

export const Candidate = mongoose.model<ICandidate>(
  "Candidate",
  candidateSchema,
);