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
      throw new Error(
        `Runtime '${selectedRuntime}' not found. Please check your runtime configuration in Settings (⌘K).`,
      );
    } else if (execError.code === "EACCES") {
      throw new Error(`Permission denied: Cannot execute the configured runtime. Please check file permissions.`);
    } else if (execError.code === "ETIMEDOUT") {
      throw new Error(`Command timeout: ccusage command took too long to execute. Try again or reconfigure runtime.`);
    } else {
      throw new Error(
        `ccusage execution failed: ${execError.message}. Please check your runtime configuration in Settings (⌘K).`,
      );
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

    // Get today's usage data
    const todayData = await loadDailyUsageData({
      since: today,
      until: today,
    });

    // Get all-time daily usage data
    const allTimeData = await loadDailyUsageData({});

    // Get session data
    const sessionData = await loadSessionData({});

    // Calculate totals for all-time data
    const allTimeTotals = calculateTotals(allTimeData);
    const allTimeTotalsObject = createTotalsObject(allTimeTotals);

    // Calculate today's totals
    let todayTotalTokens = 0;
    let todayCost = 0;
    let dailyUsage = null;

    if (todayData.length > 0) {
      const todayTotals = calculateTotals(todayData);
      const todayTotalsObject = createTotalsObject(todayTotals);
      todayTotalTokens = todayTotalsObject.totalTokens;
      todayCost = todayTotalsObject.totalCost;

      const todayEntry = todayData[0];
      dailyUsage = {
        date: today,
        inputTokens: todayEntry.inputTokens,
        outputTokens: todayEntry.outputTokens,
        totalTokens: todayTotalTokens,
        cost: todayCost,
      };
    }

    // Process session data
    const processedSessions = sessionData.slice(0, 10).map(
      (session: SessionUsage): SessionData => ({
        sessionId: session.sessionId || "",
        projectPath: session.projectPath || "",
        lastActivity: session.lastActivity || "",
        inputTokens: session.inputTokens || 0,
        outputTokens: session.outputTokens || 0,
        totalTokens: (session.inputTokens || 0) + (session.outputTokens || 0),
        totalCost: session.totalCost || 0,
        cost: session.totalCost || 0,
        model: "claude-sonnet-4-20250514", // ccusage doesn't provide model info, use default
        projectName: session.projectPath?.split("/").pop() || "Unknown Project",
      }),
    );

    return {
      daily: dailyUsage,
      total: {
        inputTokens: allTimeTotalsObject.inputTokens || 0,
        outputTokens: allTimeTotalsObject.outputTokens || 0,
        totalTokens: allTimeTotalsObject.totalTokens,
        cost: allTimeTotalsObject.totalCost,
      },
      sessions: processedSessions,
      models: [],
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching usage data:", error);
    return {
      daily: null,
      total: null,
      sessions: [],
      models: [],
      error: error instanceof Error ? error.message : String(error),
      lastUpdated: new Date().toISOString(),
    };
  }
}

export async function getDailyUsage(): Promise<DailyUsageData | null> {
  const data = await getUserUsage();
  return data.daily;
}

export async function getTotalUsage(): Promise<{
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
} | null> {
  const data = await getUserUsage();
  return data.total;
}

export async function getSessionUsage(): Promise<SessionData[]> {
  const data = await getUserUsage();
  return data.sessions;
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
