import mongoose, { Document, Schema } from "mongoose";

export interface IVoteSelection extends Document {
  voteId: mongoose.Types.ObjectId;
  electionId: mongoose.Types.ObjectId;
  positionId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
}

const voteSelectionSchema =
  new Schema<IVoteSelection>(
    {
      voteId: {
        type: Schema.Types.ObjectId,
        ref: "Vote",
        required: true,
        index: true,
      },

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
      },

      candidateId: {
        type: Schema.Types.ObjectId,
        ref: "Candidate",
        required: true,
      },
    },
    {
      timestamps: true,
    },
  );

export const VoteSelection =
  mongoose.model<IVoteSelection>(
    "VoteSelection",
    voteSelectionSchema,
  );