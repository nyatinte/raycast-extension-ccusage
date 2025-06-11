import { exec } from "child_process";
import { promisify } from "util";
import { cpus } from "os";
import { CCUsageCommandResult, CCUsageOutput, DailyUsageData, SessionData, UsageData } from "../types/usage-types";

const execAsync = promisify(exec);
const CCUSAGE_COMMAND = "npx ccusage@latest";

function getEnhancedNodePaths(): string {
  const isAppleSilicon = cpus()[0]?.model?.includes("Apple") ?? false;
  
  // Platform-specific paths based on architecture
  const platformPaths = isAppleSilicon 
    ? ["/opt/homebrew/bin", "/opt/homebrew/lib/node_modules/.bin"]
    : ["/usr/local/bin", "/usr/local/lib/node_modules/.bin"];

  // Version manager paths
  const versionManagerPaths = [
    `${process.env.HOME}/.nvm/versions/node/*/bin`,
    `${process.env.HOME}/.fnm/node-versions/*/installation/bin`,
    `${process.env.HOME}/.n/bin`,
    `${process.env.HOME}/.volta/bin`,
  ];

  // Standard system paths
  const systemPaths = [
    "/usr/bin",
    "/bin",
    `${process.env.HOME}/.npm/bin`,
    `${process.env.HOME}/.yarn/bin`,
  ];

  const allPaths = [
    process.env.PATH || "",
    ...platformPaths,
    ...versionManagerPaths,
    ...systemPaths,
  ];

  return allPaths.filter(path => path).join(":");
}

async function executeCommand(args: string): Promise<CCUsageCommandResult> {
  try {
    const command = `${CCUSAGE_COMMAND} ${args}`;

    // Enhanced environment with comprehensive PATH and Node.js version manager support
    const enhancedEnv = {
      ...process.env,
      PATH: getEnhancedNodePaths(),
      // Support for nvm
      NVM_DIR: process.env.NVM_DIR || `${process.env.HOME}/.nvm`,
      // Support for fnm
      FNM_DIR: process.env.FNM_DIR || `${process.env.HOME}/.fnm`,
      // Ensure proper npm config
      npm_config_prefix: process.env.npm_config_prefix || `${process.env.HOME}/.npm-global`,
    };

    const { stdout, stderr } = await execAsync(command, {
      env: enhancedEnv,
      shell: "/bin/bash", // Use bash shell explicitly for best compatibility
      timeout: 30000, // 30 second timeout as recommended
      cwd: process.env.HOME, // Execute from home directory
    });

    return { stdout, stderr };
  } catch (error: unknown) {
    const execError = error as { code?: string; message: string };
    // Enhanced error handling with specific error types
    if (execError.code === 'ENOENT') {
      throw new Error(`npx not found: Please install Node.js or check your PATH. Error: ${execError.message}`);
    } else if (execError.code === 'EACCES') {
      throw new Error(`Permission denied: Check file permissions for the target directory. Error: ${execError.message}`);
    } else if (execError.code === 'ETIMEDOUT') {
      throw new Error(`Command timeout: ccusage command took too long to execute. Error: ${execError.message}`);
    } else {
      throw new Error(`Failed to execute ccusage command: ${execError.message}`);
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
    const [dailyUsage, totalUsage, sessions] = await Promise.all([
      getDailyUsage(),
      getTotalUsage(),
      getSessionUsage(),
    ]);

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

export async function checkCCUsageAvailable(): Promise<boolean> {
  try {
    await executeCommand("--help");
    return true;
  } catch {
    return false;
  }
}