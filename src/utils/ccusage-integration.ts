import { exec } from "child_process";
import { promisify } from "util";
import { CCUsageCommandResult, CCUsageOutput, DailyUsageData, SessionData, UsageData } from "../types/usage-types";
import { buildCCUsageCommand, getRuntimeType } from "./preferences";

const execAsync = promisify(exec);

async function executeCommand(args: string): Promise<CCUsageCommandResult> {
  try {
    const command = buildCCUsageCommand(args);

    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    });

    return { stdout, stderr };
  } catch (error: unknown) {
    const execError = error as { code?: string; message: string };

    if (execError.code === "ENOENT") {
      const runtimeType = getRuntimeType();
      throw new Error(`Runtime '${runtimeType}' not found. Please configure your runtime in Preferences (⌘,).`);
    } else if (execError.code === "EACCES") {
      throw new Error(`Permission denied: Cannot execute the configured runtime. Please check file permissions.`);
    } else if (execError.code === "ETIMEDOUT") {
      throw new Error(`Command timeout: ccusage command took too long to execute. Try again or reconfigure runtime.`);
    } else {
      throw new Error(
        `ccusage execution failed: ${execError.message}. Please check your runtime configuration in Preferences (⌘,).`,
      );
    }
  }
}

export async function getUserUsage(): Promise<{
  daily: DailyUsageData | null;
  total: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
  } | null;
  sessions: SessionData[];
  models: unknown[];
  error?: string;
  lastUpdated: string;
}> {
  const result = await executeCommand("--json");

  if (!result.stdout.trim()) {
    throw new Error("No usage data available");
  }

  const data: CCUsageOutput = JSON.parse(result.stdout);

  // Get today's date
  const today = new Date().toISOString().split("T")[0];

  // Extract daily usage for today
  let dailyUsage = null;
  if (data.totalTokens && data.totalTokens > 0) {
    dailyUsage = {
      date: today,
      inputTokens: data.inputTokens || 0,
      outputTokens: data.outputTokens || 0,
      totalTokens: data.totalTokens,
      cost: data.cost || 0,
    };
  }

  // Extract total usage
  const totalUsage = {
    inputTokens: data.inputTokens || 0,
    outputTokens: data.outputTokens || 0,
    totalTokens: data.totalTokens || 0,
    cost: data.cost || 0,
  };

  // Extract sessions
  const processedSessions = (data.sessions || []).slice(0, 10).map((session: unknown): SessionData => {
    const sessionData = session as Record<string, unknown>;
    return {
      sessionId: (sessionData.sessionId as string) || "",
      projectPath: (sessionData.projectPath as string) || "",
      lastActivity: (sessionData.lastActivity as string) || "",
      inputTokens: (sessionData.inputTokens as number) || 0,
      outputTokens: (sessionData.outputTokens as number) || 0,
      totalTokens: ((sessionData.inputTokens as number) || 0) + ((sessionData.outputTokens as number) || 0),
      totalCost: (sessionData.totalCost as number) || 0,
      cost: (sessionData.totalCost as number) || 0,
      model: "claude-sonnet-4-20250514", // ccusage doesn't provide model info, use default
      projectName: (sessionData.projectPath as string)?.split("/").pop() || "Unknown Project",
    };
  });

  return {
    daily: dailyUsage,
    total: totalUsage,
    sessions: processedSessions,
    models: [],
    lastUpdated: new Date().toISOString(),
  };
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
    // Try to execute help command
    await executeCommand("--help");
    return true;
  } catch (error) {
    console.error("ccusage availability check failed:", error);
    return false;
  }
}
