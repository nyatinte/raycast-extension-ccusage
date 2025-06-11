import { exec } from "child_process";
import { promisify } from "util";
import { CCUsageCommandResult, CCUsageOutput, DailyUsageData, SessionData, UsageData } from "../types/usage-types";

const execAsync = promisify(exec);

export class CCUsageIntegration {
  private static readonly CCUSAGE_COMMAND = "npx ccusage@latest";

  private static getNodePaths(): string {
    // Common Node.js installation paths
    return [
      "/usr/local/bin",
      "/opt/homebrew/bin", // Homebrew on Apple Silicon
      "/usr/bin",
      "/bin",
      `${process.env.HOME}/.npm-global/bin`,
      `${process.env.HOME}/n/bin`, // n version manager
      `${process.env.HOME}/.nvm/versions/node/*/bin`, // nvm
      process.env.PATH || "",
    ].join(":");
  }

  static async executeCommand(args: string): Promise<CCUsageCommandResult> {
    try {
      const command = `${this.CCUSAGE_COMMAND} ${args}`;

      const env = {
        ...process.env,
        PATH: this.getNodePaths(),
      };

      const { stdout, stderr } = await execAsync(command, {
        env,
        shell: "/bin/bash", // Use bash shell explicitly
      });

      return { stdout, stderr };
    } catch (error) {
      throw new Error(`Failed to execute ccusage command: ${error}`);
    }
  }

  static async getDailyUsage(date?: string): Promise<DailyUsageData | null> {
    try {
      const dateArg = date ? `--since ${date} --until ${date}` : "";
      const result = await this.executeCommand(`daily ${dateArg} --json`);

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

  static async getTotalUsage(): Promise<{
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
  } | null> {
    try {
      const result = await this.executeCommand("--json");

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

  static async getSessionUsage(): Promise<SessionData[]> {
    try {
      const result = await this.executeCommand("session --json");

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

  static async getUsageByPeriod(since: string, until?: string): Promise<CCUsageOutput | null> {
    try {
      const untilArg = until ? `--until ${until}` : "";
      const result = await this.executeCommand(`--since ${since} ${untilArg} --json`);

      if (!result.stdout.trim()) {
        return null;
      }

      return JSON.parse(result.stdout);
    } catch (error) {
      console.error("Failed to get usage by period:", error);
      return null;
    }
  }

  static async getAllUsageData(): Promise<UsageData> {
    try {
      const [dailyUsage, totalUsage, sessions] = await Promise.all([
        this.getDailyUsage(),
        this.getTotalUsage(),
        this.getSessionUsage(),
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

  static async checkCCUsageAvailable(): Promise<boolean> {
    try {
      await this.executeCommand("--help");
      return true;
    } catch {
      return false;
    }
  }
}
