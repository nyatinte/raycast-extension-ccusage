import { getPreferenceValues } from "@raycast/api";

export interface Preferences {
  runtimeType: "npx" | "bunx" | "pnpm" | "deno";
  customRuntimePath?: string;
}

/**
 * Get user preferences with type safety
 */
export function getPreferences(): Preferences {
  return getPreferenceValues<Preferences>();
}

/**
 * Get the runtime type from preferences
 */
export function getRuntimeType(): Preferences["runtimeType"] {
  const preferences = getPreferences();
  return preferences.runtimeType || "npx";
}

/**
 * Get custom runtime path from preferences
 */
export function getCustomRuntimePath(): string | undefined {
  const preferences = getPreferences();
  return preferences.customRuntimePath;
}

/**
 * Runtime command mappings
 */
export const RUNTIME_COMMANDS: Record<Preferences["runtimeType"], string[]> = {
  npx: ["npx", "ccusage@latest"],
  bunx: ["bunx", "ccusage@latest"],
  pnpm: ["pnpm", "dlx", "ccusage@latest"],
  deno: ["deno", "run", "npm:ccusage@latest"],
};

/**
 * Build ccusage command based on preferences
 */
export function buildCCUsageCommand(args: string): string {
  const runtimeType = getRuntimeType();
  const customPath = getCustomRuntimePath();
  const commands = RUNTIME_COMMANDS[runtimeType];

  // Use custom path if specified, otherwise use default commands
  if (customPath && commands.length > 0) {
    const modifiedCommands = [customPath, ...commands.slice(1)];
    return `${modifiedCommands.join(" ")} ${args}`;
  }

  return `${commands.join(" ")} ${args}`;
}