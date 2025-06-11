import { useExec } from "@raycast/utils";
import { useInterval } from "usehooks-ts";
import { cpus } from "os";
import {
  UsageData,
  UsageStats,
  CCUsageOutput,
  DailyUsageData,
  MonthlyUsageData,
  SessionData,
} from "../types/usage-types";
import { getRecentSessions } from "../utils/usage-calculator";

function getEnhancedNodePaths(): string {
  const isAppleSilicon = cpus()[0]?.model?.includes("Apple") ?? false;

  const platformPaths = isAppleSilicon
    ? ["/opt/homebrew/bin", "/opt/homebrew/lib/node_modules/.bin"]
    : ["/usr/local/bin", "/usr/local/lib/node_modules/.bin"];

  const versionManagerPaths = [
    `${process.env.HOME}/.nvm/versions/node/*/bin`,
    `${process.env.HOME}/.fnm/node-versions/*/installation/bin`,
    `${process.env.HOME}/.n/bin`,
    `${process.env.HOME}/.volta/bin`,
  ];

  const systemPaths = ["/usr/bin", "/bin", `${process.env.HOME}/.npm/bin`, `${process.env.HOME}/.yarn/bin`];

  const allPaths = [process.env.PATH || "", ...platformPaths, ...versionManagerPaths, ...systemPaths];

  return allPaths.filter((path) => path).join(":");
}

const execOptions = {
  shell: false,
  timeout: 30000,
  cwd: process.env.HOME,
  env: {
    ...process.env,
    PATH: getEnhancedNodePaths(),
    NVM_DIR: process.env.NVM_DIR || `${process.env.HOME}/.nvm`,
    FNM_DIR: process.env.FNM_DIR || `${process.env.HOME}/.fnm`,
    npm_config_prefix: process.env.npm_config_prefix || `${process.env.HOME}/.npm-global`,
  },
};

export function useUsageData() {
  const { data: rawData, isLoading, error, revalidate } = useExec("npx", ["ccusage@latest", "--json"], execOptions);

  // Parse and process the data
  let data: UsageData = {
    daily: null,
    total: null,
    sessions: [],
    models: [],
    lastUpdated: new Date().toISOString(),
  };

  if (rawData && !error) {
    try {
      const parsed: CCUsageOutput = JSON.parse(rawData);

      // Process total usage
      const total = parsed.totals
        ? {
            inputTokens: parsed.totals.inputTokens || 0,
            outputTokens: parsed.totals.outputTokens || 0,
            totalTokens: parsed.totals.totalTokens || 0,
            cost: parsed.totals.totalCost || 0,
          }
        : null;

      data = {
        daily: null, // Will be handled by useDailyUsage
        total,
        sessions: [],
        models: [],
        lastUpdated: new Date().toISOString(),
      };
    } catch (parseError) {
      console.error("Failed to parse ccusage output:", parseError);
    }
  }

  return {
    data,
    isLoading,
    error,
    revalidate,
  };
}

export function useDailyUsage(refreshInterval: number = 10000) {
  const {
    data: rawData,
    isLoading,
    error,
    revalidate,
  } = useExec("npx", ["ccusage@latest", "daily", "--json"], execOptions);

  let data: DailyUsageData | null = null;

  if (rawData && !error) {
    try {
      const parsed: CCUsageOutput = JSON.parse(rawData);
      const today = new Date().toISOString().split("T")[0];

      if (parsed.daily && parsed.daily.length > 0) {
        const todayEntry = parsed.daily.find((d) => d.date === today);
        if (todayEntry) {
          data = {
            ...todayEntry,
            cost: todayEntry.totalCost || todayEntry.cost || 0,
          };
        } else {
          const latest = parsed.daily[parsed.daily.length - 1];
          data = {
            ...latest,
            cost: latest.totalCost || latest.cost || 0,
          };
        }
      }
    } catch (parseError) {
      console.error("Failed to parse daily usage:", parseError);
    }
  }

  useInterval(() => {
    revalidate();
  }, refreshInterval);

  return { data, isLoading, error, revalidate };
}

export function useTotalUsage(refreshInterval: number = 30000) {
  const { data: rawData, isLoading, error, revalidate } = useExec("npx", ["ccusage@latest", "--json"], execOptions);

  let data: { inputTokens: number; outputTokens: number; totalTokens: number; cost: number } | null = null;

  if (rawData && !error) {
    try {
      const parsed: CCUsageOutput = JSON.parse(rawData);

      if (parsed.totals) {
        data = {
          inputTokens: parsed.totals.inputTokens || 0,
          outputTokens: parsed.totals.outputTokens || 0,
          totalTokens: parsed.totals.totalTokens || 0,
          cost: parsed.totals.totalCost || 0,
        };
      }
    } catch (parseError) {
      console.error("Failed to parse total usage:", parseError);
    }
  }

  useInterval(() => {
    revalidate();
  }, refreshInterval);

  return { data, isLoading, error, revalidate };
}

export function useSessionUsage(refreshInterval: number = 15000) {
  const {
    data: rawData,
    isLoading,
    error,
    revalidate,
  } = useExec("npx", ["ccusage@latest", "session", "--json"], execOptions);

  let data: SessionData[] = [];

  if (rawData && !error) {
    try {
      const parsed: CCUsageOutput = JSON.parse(rawData);
      const sessions = parsed.sessions || [];

      data = sessions.map((session) => ({
        ...session,
        cost: session.totalCost || session.cost || 0,
        startTime: session.lastActivity,
        model: session.model || "claude-3-5-sonnet-20241022",
        projectName: session.projectPath?.split("/").pop() || "Unknown Project",
      }));
    } catch (parseError) {
      console.error("Failed to parse session usage:", parseError);
    }
  }

  useInterval(() => {
    revalidate();
  }, refreshInterval);

  return { data, isLoading, error, revalidate };
}

export function useUsageStats(refreshInterval: number = 5000): UsageStats & { revalidate: () => void } {
  const totalUsage = useTotalUsage(refreshInterval);
  const dailyUsage = useDailyUsage(refreshInterval);
  const sessionUsage = useSessionUsage(refreshInterval);

  const stats: UsageStats = {
    todayUsage: dailyUsage.data,
    totalUsage: totalUsage.data,
    recentSessions: sessionUsage.data ? getRecentSessions(sessionUsage.data, 5) : [],
    topModels: [], // TODO: Calculate from sessions
    isLoading: totalUsage.isLoading || dailyUsage.isLoading || sessionUsage.isLoading,
    error: totalUsage.error?.message || dailyUsage.error?.message || sessionUsage.error?.message,
  };

  return {
    ...stats,
    revalidate: () => {
      totalUsage.revalidate();
      dailyUsage.revalidate();
      sessionUsage.revalidate();
    },
  };
}

export function useccusageAvailability() {
  const { data: rawData, isLoading, error, revalidate } = useExec("npx", ["ccusage@latest", "--help"], execOptions);

  return {
    isAvailable: !error && rawData !== undefined,
    isLoading,
    error,
    revalidate,
  };
}

export function useUsageByPeriod(since: string, until?: string, refreshInterval: number = 60000) {
  const args = ["ccusage@latest", `--since`, since];
  if (until) {
    args.push("--until", until);
  }
  args.push("--json");

  const { data: rawData, isLoading, error, revalidate } = useExec("npx", args, execOptions);

  let data: CCUsageOutput | null = null;

  if (rawData && !error) {
    try {
      data = JSON.parse(rawData);
    } catch (parseError) {
      console.error("Failed to parse period usage:", parseError);
    }
  }

  useInterval(() => {
    revalidate();
  }, refreshInterval);

  return { data, isLoading, error, revalidate };
}

export function useMonthlyUsage() {
  const {
    data: rawData,
    isLoading,
    error,
    revalidate,
  } = useExec("npx", ["ccusage@latest", "monthly", "--json"], execOptions);

  let data: MonthlyUsageData | null = null;

  if (rawData && !error) {
    try {
      const parsed: CCUsageOutput = JSON.parse(rawData);
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

      if (parsed.monthly && parsed.monthly.length > 0) {
        const currentMonthEntry = parsed.monthly.find((m) => m.month === currentMonth);
        if (currentMonthEntry) {
          data = {
            ...currentMonthEntry,
            cost: currentMonthEntry.totalCost || 0,
          };
        } else {
          // If no current month data, return the latest month
          const latest = parsed.monthly[parsed.monthly.length - 1];
          data = {
            ...latest,
            cost: latest.totalCost || 0,
          };
        }
      }
    } catch (parseError) {
      console.error("Failed to parse monthly usage:", parseError);
    }
  }

  return { data, isLoading, error, revalidate };
}
