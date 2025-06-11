export interface RuntimeConfig {
  type: "npx" | "bunx" | "pnpm" | "deno";
  path?: string;
  verified: boolean;
  lastChecked?: string;
}

export interface RuntimeSettings {
  selectedRuntime?: RuntimeConfig["type"];
  customPath?: string;
  runtimes: Partial<Record<RuntimeConfig["type"], RuntimeConfig>>;
  initialized: boolean;
}

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
} as const;
