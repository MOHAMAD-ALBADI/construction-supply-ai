import { z } from "zod";

// Browser-safe configuration (Doc 5 §7). Server secrets live in src/server/env.ts.
// NEXT_PUBLIC_* values are inlined at build time, so each one is referenced literally below.

// Hosting dashboards often store unset variables as "", which must behave like "not set".
const optionalText = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().trim().min(1).optional(),
);

const PublicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.preprocess((value) => (value === "" ? undefined : value), z.url().optional()),
  NEXT_PUBLIC_BRAND_NAME_AR: optionalText,
  NEXT_PUBLIC_BRAND_NAME_EN: optionalText,
  // UI-only mirror of DEMO_MODE (banner, labels). It carries no security meaning.
  NEXT_PUBLIC_DEMO_MODE: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
});

export type PublicEnv = z.infer<typeof PublicEnvSchema>;

export const publicEnv: PublicEnv = PublicEnvSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_BRAND_NAME_AR: process.env.NEXT_PUBLIC_BRAND_NAME_AR,
  NEXT_PUBLIC_BRAND_NAME_EN: process.env.NEXT_PUBLIC_BRAND_NAME_EN,
  NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE || undefined,
});
