import { z } from "zod";

import { parseEnvironment } from "./parse";

const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url().default("https://missing.supabase.co"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1)
    .default("missing-publishable-key"),
  NEXT_PUBLIC_API_URL: z.url().default("http://localhost:3001"),
});

export const publicEnv = parseEnvironment(
  publicEnvironmentSchema,
  {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  "public",
);
