import { exec } from "child_process";
import { promisify } from "util";
import { CCUsageCommandResult, CCUsageOutput, DailyUsageData, SessionData, UsageData } from "../types/usage-types";

const execAsync = promisify(exec);

export class CCUsageIntegration {
  private static readonly CCUSAGE_COMMAND = "npx ccusage@latest";

  private static getNodePaths(): string[] {
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
        // Ensure npm global packages are available
        NODE_PATH: `${process.env.HOME}/.npm-global/lib/node_modules:${process.env.NODE_PATH || ""}`,
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
      return {
        date: data.date || new Date().toISOString().split("T")[0],
        inputTokens: data.inputTokens || 0,
        outputTokens: data.outputTokens || 0,
        totalTokens: data.totalTokens || 0,
        cost: data.cost || 0,
      };
    } catch (error) {
      console.error("Failed to get daily usage:", error);
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
      return {
        inputTokens: data.inputTokens || 0,
        outputTokens: data.outputTokens || 0,
        totalTokens: data.totalTokens || 0,
        cost: data.cost || 0,
      };
    } catch (error) {
      console.error("Failed to get total usage:", error);
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
      return data.sessions || [];
    } catch (error) {
      console.error("Failed to get session usage:", error);
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

      return {
        daily: dailyUsage,
        total: totalUsage,
        sessions: sessions.slice(0, 10), // Latest 10 sessions
        models: Array.from(modelMap.values()),
        lastUpdated: new Date().toISOString(),
      };
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
