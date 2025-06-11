import { z } from "zod";

// Runtime type enum
export const RuntimeTypeSchema = z.enum(["npx", "bunx", "pnpm", "deno"]);

export const RuntimeConfigSchema = z.object({
  type: RuntimeTypeSchema,
  path: z.string().optional(),
  verified: z.boolean(),
  lastChecked: z.string().optional(),
});

export const RuntimeSettingsSchema = z.object({
  selectedRuntime: RuntimeTypeSchema.optional(),
  customPath: z.string().optional(),
  runtimes: z.record(RuntimeTypeSchema, RuntimeConfigSchema.partial()).optional(),
  initialized: z.boolean(),
});

// Export types inferred from schemas
export type RuntimeType = z.infer<typeof RuntimeTypeSchema>;
export type RuntimeConfig = z.infer<typeof RuntimeConfigSchema>;
export type RuntimeSettings = z.infer<typeof RuntimeSettingsSchema>;

export const DEFAULT_RUNTIME_SETTINGS: RuntimeSettings = {
  runtimes: {},
  initialized: false,
};

export const RUNTIME_COMMANDS = {
  npx: ["npx", "ccusage@latest"],
  bunx: ["bunx", "ccusage"],
  pnpm: ["pnpm", "dlx", "ccusage"],
  deno: [
    "deno",
    "run",
    "-E",
    "-R=$HOME/.claude/projects/",
    "-S=homedir",
    "-N=raw.githubusercontent.com:443",
    "npm:ccusage@latest",
  ],
} as const satisfies Record<RuntimeType, readonly string[]>;

// Validation helpers
export const validateRuntimeSettings = (data: unknown): RuntimeSettings | null => {
  const result = RuntimeSettingsSchema.safeParse(data);
  return result.success ? result.data : null;
};

export const validateRuntimeConfig = (data: unknown): RuntimeConfig | null => {
  const result = RuntimeConfigSchema.safeParse(data);
  return result.success ? result.data : null;
};
