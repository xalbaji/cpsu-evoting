import { z } from "zod";
import { isKnownCourse } from "../constants/courses.js";

export const registerSchema = z.object({
  studentId: z.string().min(3),
  firstName: z.string().min(2),
  middleInitial: z
    .string()
    .trim()
    .max(2)
    .optional()
    .or(z.literal("")),
  lastName: z.string().min(2),
  suffix: z
    .enum(["", "Jr.", "Sr.", "II", "III", "IV", "V"])
    .optional(),
  email: z.string().email(),
  password: z.string().min(8),
  course: z.string().trim().min(1).refine(isKnownCourse, "Select a valid CPSU Main Campus course"),
  yearLevel: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const changePasswordSchema = z.object({
  newPassword: z.string().min(8),
});
