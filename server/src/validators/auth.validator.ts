import { z } from "zod";

export const registerSchema = z.object({
  studentId: z.string().min(3),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  course: z.string().optional(),
  yearLevel: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const changePasswordSchema = z.object({
  newPassword: z.string().min(8),
});
