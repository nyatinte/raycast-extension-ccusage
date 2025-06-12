import { exec } from "child_process";
import { promisify } from "util";
import { match } from "ts-pattern";
import { CCUsageCommandResult, CCUsageOutput, DailyUsageData, SessionData } from "../types/usage-types";
import { buildCCUsageCommand, getRuntimeType } from "./preferences";

const execAsync = promisify(exec);

const executeCCUsageCommand = async (args: string): Promise<CCUsageCommandResult> => {
  try {
    const command = buildCCUsageCommand(args);

    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    });

    return { stdout, stderr };
  } catch (error: unknown) {
    const execError = error as { code?: string; message: string };

    throw match(execError.code)
      .with("ENOENT", () => {
        const runtimeType = getRuntimeType();
        return new Error(`Runtime '${runtimeType}' not found. Please configure your runtime in Preferences (⌘,).`);
      })
      .with(
        "EACCES",
        () => new Error(`Permission denied: Cannot execute the configured runtime. Please check file permissions.`),
      )
      .with(
        "ETIMEDOUT",
        () => new Error(`Command timeout: ccusage command took too long to execute. Try again or reconfigure runtime.`),
      )
      .otherwise(
        () =>
          new Error(
            `ccusage execution failed: ${execError.message}. Please check your runtime configuration in Preferences (⌘,).`,
          ),
      );
  }
};

type GetUserUsageDataResult = {
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
};

export const getUserUsageData = async (): Promise<GetUserUsageDataResult> => {
  const result = await executeCCUsageCommand("--json");

  if (!result.stdout.trim()) {
    throw new Error("No usage data available");
  }

  const data: CCUsageOutput = JSON.parse(result.stdout);

  // Get today's date
  const today = new Date().toISOString().split("T")[0];

  // Extract daily usage for today
  const dailyUsage: DailyUsageData | null =
    data.totalTokens && data.totalTokens > 0
      ? {
          date: today,
          inputTokens: data.inputTokens || 0,
          outputTokens: data.outputTokens || 0,
          totalTokens: data.totalTokens,
          cost: data.cost || 0,
        }
      : null;

  // Extract total usage
  const totalUsage = {
    inputTokens: data.inputTokens || 0,
    outputTokens: data.outputTokens || 0,
    totalTokens: data.totalTokens || 0,
    cost: data.cost || 0,
  };

  // Transform sessions data
  const transformSessionData = (session: unknown): SessionData => {
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
      model: (sessionData.model as string) || "unknown",
      projectName: (sessionData.projectPath as string)?.split("/").pop() || "Unknown Project",
    };
  };

  const processedSessions = (data.sessions || []).slice(0, 10).map(transformSessionData);

  return {
    daily: dailyUsage,
    total: totalUsage,
    sessions: processedSessions,
    models: [],
    lastUpdated: new Date().toISOString(),
  };
};

export const getDailyUsage = async (): Promise<DailyUsageData | null> => {
  const data = await getUserUsageData();
  return data.daily;
};

export const getTotalUsage = async (): Promise<{
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
} | null> => {
  const data = await getUserUsageData();
  return data.total;
};

export const getSessionUsage = async (): Promise<SessionData[]> => {
  const data = await getUserUsageData();
  return data.sessions;
};
