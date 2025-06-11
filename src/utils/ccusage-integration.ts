import { exec } from "child_process";
import { promisify } from "util";
import { CCUsageCommandResult, CCUsageOutput, DailyUsageData, SessionData, UsageData } from "../types/usage-types";
import { RUNTIME_COMMANDS } from "../types/runtime-types";
import { getSelectedRuntime, getSelectedRuntimePath, hasValidRuntimeConfig } from "./runtime-settings";

const execAsync = promisify(exec);

/**
 * ランタイム設定の事前チェック
 */
async function ensureRuntimeConfigured(): Promise<void> {
  const hasValidConfig = await hasValidRuntimeConfig();
  if (!hasValidConfig) {
    throw new Error("Runtime configuration is required. Please configure your runtime in Settings (⌘K).");
  }
}

/**
 * 設定されたランタイムでccusageコマンドを構築
 */
async function buildccusageCommand(args: string): Promise<string> {
  await ensureRuntimeConfigured();
  
  const selectedRuntime = await getSelectedRuntime();
  const customPath = await getSelectedRuntimePath();

  // At this point, selectedRuntime should never be null due to ensureRuntimeConfigured()
  if (!selectedRuntime) {
    throw new Error("Internal error: Runtime configuration validation failed.");
  }

  const commands = RUNTIME_COMMANDS[selectedRuntime];

  // Use custom path if specified, otherwise use commands directly
  if (customPath && commands.length > 0) {
    const modifiedCommands = [customPath, ...commands.slice(1)];
    return `${modifiedCommands.join(" ")} ${args}`;
  }

  return `${commands.join(" ")} ${args}`;
}

async function executeCommand(args: string): Promise<CCUsageCommandResult> {
  try {
    const command = await buildccusageCommand(args);

    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    });

    return { stdout, stderr };
  } catch (error: unknown) {
    const execError = error as { code?: string; message: string };
    
    if (execError.code === "ENOENT") {
      const selectedRuntime = await getSelectedRuntime();
      throw new Error(`Runtime '${selectedRuntime}' not found. Please check your runtime configuration in Settings (⌘K).`);
    } else if (execError.code === "EACCES") {
      throw new Error(`Permission denied: Cannot execute the configured runtime. Please check file permissions.`);
    } else if (execError.code === "ETIMEDOUT") {
      throw new Error(`Command timeout: ccusage command took too long to execute. Try again or reconfigure runtime.`);
    } else {
      throw new Error(`ccusage execution failed: ${execError.message}. Please check your runtime configuration in Settings (⌘K).`);
    }
  }
}

export async function getDailyUsage(date?: string): Promise<DailyUsageData | null> {
  try {
    const dateArg = date ? `--since ${date} --until ${date}` : "";
    const result = await executeCommand(`daily ${dateArg} --json`);

    if (!result.stdout.trim()) {
      return null;
    }

    const data: CCUsageOutput = JSON.parse(result.stdout);

    // Get today's date
    const today = new Date().toISOString().split("T")[0];

    // Find today's usage from daily array or use totals as fallback
    let todayUsage: DailyUsageData | null = null;

    if (data.daily && data.daily.length > 0) {
      // Find today's entry in the daily array
      const todayEntry = data.daily.find((d) => d.date === today);
      if (todayEntry) {
        todayUsage = {
          ...todayEntry,
          cost: todayEntry.totalCost || todayEntry.cost || 0,
        };
      } else {
        // Use the latest entry if today's entry not found
        const latest = data.daily[data.daily.length - 1];
        todayUsage = {
          ...latest,
          cost: latest.totalCost || latest.cost || 0,
        };
      }
    } else if (data.totals) {
      // Fallback to totals if no daily data
      todayUsage = {
        date: today,
        inputTokens: data.totals.inputTokens || 0,
        outputTokens: data.totals.outputTokens || 0,
        cacheCreationTokens: data.totals.cacheCreationTokens,
        cacheReadTokens: data.totals.cacheReadTokens,
        totalTokens: data.totals.totalTokens || 0,
        totalCost: data.totals.totalCost,
        cost: data.totals.totalCost || 0,
      };
    }

    return todayUsage;
  } catch {
    return null;
  }
}

export async function getTotalUsage(): Promise<{
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
} | null> {
  try {
    const result = await executeCommand("--json");

    if (!result.stdout.trim()) {
      return null;
    }

    const data: CCUsageOutput = JSON.parse(result.stdout);

    let totalUsage = null;

    if (data.totals) {
      totalUsage = {
        inputTokens: data.totals.inputTokens || 0,
        outputTokens: data.totals.outputTokens || 0,
        totalTokens: data.totals.totalTokens || 0,
        cost: data.totals.totalCost || 0,
      };
    } else {
      // Fallback to legacy fields
      totalUsage = {
        inputTokens: data.inputTokens || 0,
        outputTokens: data.outputTokens || 0,
        totalTokens: data.totalTokens || 0,
        cost: data.cost || 0,
      };
    }

    return totalUsage;
  } catch {
    return null;
  }
}

export async function getSessionUsage(): Promise<SessionData[]> {
  try {
    const result = await executeCommand("session --json");

    if (!result.stdout.trim()) {
      return [];
    }

    const data: CCUsageOutput = JSON.parse(result.stdout);

    const sessions = data.sessions || [];

    // Process sessions to add compatibility fields
    const processedSessions = sessions.map((session) => ({
      ...session,
      cost: session.totalCost || session.cost || 0,
      startTime: session.lastActivity,
      model: session.model || "claude-3-5-sonnet-20241022", // Default model assumption
      projectName: session.projectPath?.split("/").pop() || "Unknown Project",
    }));

    return processedSessions;
  } catch {
    return [];
  }
}

export async function getUsageByPeriod(since: string, until?: string): Promise<CCUsageOutput | null> {
  try {
    const untilArg = until ? `--until ${until}` : "";
    const result = await executeCommand(`--since ${since} ${untilArg} --json`);

    if (!result.stdout.trim()) {
      return null;
    }

    return JSON.parse(result.stdout);
  } catch (error) {
    console.error("Failed to get usage by period:", error);
    return null;
  }
}

export async function getAllUsageData(): Promise<UsageData> {
  try {
    const [dailyUsage, totalUsage, sessions] = await Promise.all([getDailyUsage(), getTotalUsage(), getSessionUsage()]);

    // Group sessions by model for model breakdown
    const modelMap = new Map();
    sessions.forEach((session) => {
      const existing = modelMap.get(session.model) || {
        model: session.model,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        cost: 0,
        sessionCount: 0,
      };

      existing.inputTokens += session.inputTokens;
      existing.outputTokens += session.outputTokens;
      existing.totalTokens += session.totalTokens;
      existing.cost += session.cost;
      existing.sessionCount += 1;

      modelMap.set(session.model, existing);
    });

    const finalData = {
      daily: dailyUsage,
      total: totalUsage,
      sessions: sessions.slice(0, 10), // Latest 10 sessions
      models: Array.from(modelMap.values()),
      lastUpdated: new Date().toISOString(),
    };

    return finalData;
  } catch (error) {
    return {
      daily: null,
      total: null,
      sessions: [],
      models: [],
      error: `Failed to fetch usage data: ${error}`,
      lastUpdated: new Date().toISOString(),
    };
  }
}

export async function checkccusageAvailable(): Promise<boolean> {
  try {
    // First ensure runtime is configured
    await ensureRuntimeConfigured();
    
    // Then try to execute help command
    await executeCommand("--help");
    return true;
  } catch (error) {
    console.error("ccusage availability check failed:", error);
    return false;
  }
}
