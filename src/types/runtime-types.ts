/**
 * Runtime types for preferences-based configuration
 * This file maintains backward compatibility for type references
 * while the actual preferences are managed through Raycast Preferences API
 */

export type RuntimeType = "npx" | "bunx" | "pnpm" | "deno";

/**
 * @deprecated Use preferences.ts instead - this is kept for backward compatibility
 */
export type RuntimeConfig = {
  type: RuntimeType;
  path?: string;
};

/**
 * @deprecated Use preferences.ts instead - this is kept for backward compatibility
 */
export type RuntimeSettings = {
  selectedRuntime?: RuntimeType;
  customPath?: string;
};
