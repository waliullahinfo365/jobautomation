import { z } from "zod";
import { SLUG_TO_PROVIDER } from "../utils/provider-slug";

const SLUG_KEYS = Object.keys(SLUG_TO_PROVIDER) as [string, ...string[]];

/** All integration URL slugs (single source: `SLUG_TO_PROVIDER`). */
export const INTEGRATION_PROVIDER_SLUGS = SLUG_KEYS;

export const integrationProviderParamSchema = z.object({
  provider: z.enum(SLUG_KEYS),
});

export const integrationConnectBodySchema = z.object({
  connectedEmail: z.string().email().optional(),
  accountName: z.string().max(200).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  scopes: z.array(z.string()).optional(),
});

export type IntegrationConnectBody = z.infer<typeof integrationConnectBodySchema>;

export const resendTestBodySchema = z.object({
  to: z.string().email().optional(),
});

export type ResendTestBody = z.infer<typeof resendTestBodySchema>;
