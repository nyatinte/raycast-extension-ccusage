import { DailyUsageData, SessionData, UsageData } from "../types/usage-types";

async function getUserUsage(): Promise<UsageData> {
  try {
    // @ts-expect-error - dynamic import of ESM module
    const { loadDailyUsageData, loadSessionData } = await import("ccusage/data-loader");
    // @ts-expect-error - dynamic import of ESM module
    const { calculateTotals, createTotalsObject } = await import("ccusage/calculate-cost");

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
    const processedSessions = sessionData.slice(0, 10).map((session: any) => ({
      sessionId: session.sessionId || "",
      projectPath: session.projectPath || "",
      lastActivity: session.lastActivity || session.date || "",
      inputTokens: session.inputTokens || 0,
      outputTokens: session.outputTokens || 0,
      totalTokens: session.inputTokens + session.outputTokens || 0,
      totalCost: session.totalCost || 0,
      cost: session.totalCost || 0,
      model: session.model || "claude-3-5-sonnet-20241022",
      projectName: session.projectPath?.split("/").pop() || "Unknown Project",
    }));

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
  return await getUserUsage();
}

export async function checkCCUsageAvailable(): Promise<boolean> {
  try {
    // @ts-expect-error - dynamic import of ESM module
    await import("ccusage/data-loader");
    return true;
  } catch {
    return false;
  }
}