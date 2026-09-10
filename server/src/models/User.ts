import mongoose, { Document, Schema } from "mongoose";

export type UserRole =
  | "ADMIN"
  | "VOTER"
  | "ELECTION_OFFICER";

export interface IUser extends Document {
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  course?: string;
  yearLevel?: string;
  avatarUrl?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["ADMIN", "VOTER", "ELECTION_OFFICER"],
      default: "VOTER",
    },

    course: String,

    yearLevel: String,

    avatarUrl: {
      type: String,
      default: "",
      maxlength: 3_000_000,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.model<IUser>("User", userSchema);
