import { z } from "zod";

export const aiTestBodySchema = z.object({
  provider: z.enum(["OpenAI", "Claude", "Stub"]).optional(),
  model: z.string().max(200).optional(),
  samplePrompt: z.string().max(32_000).optional(),
});
