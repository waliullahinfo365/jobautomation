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

export const forgotPasswordBodySchema = z.object({
  email: z.string().email(),
});

export const resetPasswordBodySchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

export const updateProfileBodySchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
});

export const uploadAvatarBodySchema = z.object({
  imageData: z.string().min(1, "Image data is required").max(3_000_000),
});

export const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});

export const securitySettingsSchema = z.object({
  twoFactorAuth: z.boolean().optional(),
  loginAlerts: z.boolean().optional(),
  sessionTimeout: z.boolean().optional(),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
