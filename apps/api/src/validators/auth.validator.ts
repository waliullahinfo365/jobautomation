import { z } from "zod";

const passwordSchema = z.string().min(8, "Password must be at least 8 characters");

export const registerBodySchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email(),
  password: passwordSchema,
  workspaceName: z.string().min(1, "Workspace name is required").max(200),
});

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
