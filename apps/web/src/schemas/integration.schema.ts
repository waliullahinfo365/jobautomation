import { z } from "zod";

export const integrationSchema = z.object({
  provider: z.enum([
    "gmail",
    "google-drive",
    "google-calendar",
    "claude",
    "anthropic",
    "smtp",
  ]),
  config: z.record(z.unknown()).default({}),
});

export type IntegrationSchemaInput = z.infer<typeof integrationSchema>;
