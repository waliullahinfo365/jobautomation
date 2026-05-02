export type UserRole = "admin" | "user";

export interface User {
  _id:          string;
  name:         string;
  email:        string;
  image?:       string;
  role:         UserRole;
  passwordHash?: string;
  integrations: {
    google?: {
      accessToken?:  string;
      refreshToken?: string;
      expiresAt?:    number;
    };
  };
  preferences: {
    timezone:         string;
    digestTime:       string;  // HH:mm
    weeklyReportDay:  number;  // 0=Sun … 6=Sat
    emailNotifications: boolean;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type PublicUser = Omit<User, "passwordHash" | "integrations">;
