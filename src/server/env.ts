import "server-only";

import { z } from "zod";

// Server-only configuration (Doc 5 §7). Parsed lazily on first use so that stages which
// do not need a secret yet can still build and deploy without it.
const ServerEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().min(1),
  OPENAI_REASONING_EFFORT: z.enum(["minimal", "low", "medium", "high"]).optional(),
  OPENAI_TIMEOUT_MS: z.coerce.number().int().positive().default(60_000),
  OPENAI_STORE_RESPONSES: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  AGENT_MAX_TOOL_ITERATIONS: z.coerce.number().int().min(1).max(20).default(8),
  NEGOTIATION_MAX_ASK_PCT: z.coerce.number().gt(0).lt(1).default(0.1),
  DEMO_MODE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  DEMO_USER_PASSWORD: z.string().min(12).optional(),
});

export type ServerEnv = z.infer<typeof ServerEnvSchema>;

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  if (!cached) {
    const blankAsUnset = Object.fromEntries(
      Object.entries(process.env).filter(([, value]) => value !== ""),
    );
    cached = ServerEnvSchema.parse(blankAsUnset);
  }
  return cached;
}
