export type UserRole =
  | "ADMIN"
  | "VOTER"
  | "ELECTION_OFFICER";

export interface User {
  _id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  course?: string;
  yearLevel?: string;
  isActive: boolean;
  isVerified: boolean;
}