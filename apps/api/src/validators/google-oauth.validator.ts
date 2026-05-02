import { z } from "zod";

export const googleOAuthProviderParamSchema = z.object({
  provider: z.enum(["gmail", "google-drive", "google-calendar"]),
});
