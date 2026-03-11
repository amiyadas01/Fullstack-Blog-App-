import { z } from "zod";

export const userCreationSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .max(100, "Full name cannot exceed 100 characters")
    .trim(),

  email: z.string().email("Invalid email address").toLowerCase(),

  password: z.string().min(6, "Password must be at least 6 characters long"),
});
