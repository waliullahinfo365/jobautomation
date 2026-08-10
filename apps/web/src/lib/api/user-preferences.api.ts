import { apiFetch } from "./client";
import type { NotificationPreferences } from "@/types/settings";

export interface UserPreferences {
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  yearsExperience?: number;
  currentTitle?: string;
  desiredSalary?: string;
  noticePeriod?: string;
  rightToWork?: boolean;
  requiresSponsorship?: boolean;
  notifications?: NotificationPreferences;
  securitySettings?: {
    twoFactorAuth?: boolean;
    loginAlerts?: boolean;
    sessionTimeout?: boolean;
  };
}

export function getUserPreferences() {
  return apiFetch<UserPreferences>("/auth/me/preferences");
}

export function updateUserPreferences(prefs: Partial<UserPreferences>) {
  return apiFetch<UserPreferences>("/auth/me/preferences", { method: "PATCH", body: prefs as Record<string, unknown> });
}
