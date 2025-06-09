import { DailyUsageData, SessionData, ModelUsage } from "../types/usage-types";

export class UsageCalculator {
  static calculateDailyGrowth(
    current: DailyUsageData | null,
    previous: DailyUsageData | null,
  ): {
    tokenGrowth: number;
    costGrowth: number;
    tokenGrowthPercentage: string;
    costGrowthPercentage: string;
  } {
    if (!current || !previous) {
      return {
        tokenGrowth: 0,
        costGrowth: 0,
        tokenGrowthPercentage: "0%",
        costGrowthPercentage: "0%",
      };
    }

    const tokenGrowth = current.totalTokens - previous.totalTokens;
    const costGrowth = current.cost - previous.cost;

    const tokenGrowthPercentage =
      previous.totalTokens > 0 ? `${((tokenGrowth / previous.totalTokens) * 100).toFixed(1)}%` : "0%";

    const costGrowthPercentage = previous.cost > 0 ? `${((costGrowth / previous.cost) * 100).toFixed(1)}%` : "0%";

    return {
      tokenGrowth,
      costGrowth,
      tokenGrowthPercentage,
      costGrowthPercentage,
    };
  }

  static getTopModels(models: ModelUsage[], limit: number = 5): ModelUsage[] {
    return models.sort((a, b) => b.totalTokens - a.totalTokens).slice(0, limit);
  }

  static getRecentSessions(sessions: SessionData[], limit: number = 10): SessionData[] {
    return sessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).slice(0, limit);
  }

  static calculateAverageSessionCost(sessions: SessionData[]): number {
    if (sessions.length === 0) return 0;
    const totalCost = sessions.reduce((sum, session) => sum + session.cost, 0);
    return totalCost / sessions.length;
  }

  static calculateAverageSessionTokens(sessions: SessionData[]): number {
    if (sessions.length === 0) return 0;
    const totalTokens = sessions.reduce((sum, session) => sum + session.totalTokens, 0);
    return totalTokens / sessions.length;
  }

  static getSessionsByTimeRange(sessions: SessionData[], hours: number): SessionData[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return sessions.filter((session) => new Date(session.startTime) >= cutoff);
  }

  static calculateCostBreakdown(models: ModelUsage[]): {
    totalCost: number;
    breakdown: Array<{ model: string; cost: number; percentage: string }>;
  } {
    const totalCost = models.reduce((sum, model) => sum + model.cost, 0);

    const breakdown = models.map((model) => ({
      model: model.model,
      cost: model.cost,
      percentage: totalCost > 0 ? `${((model.cost / totalCost) * 100).toFixed(1)}%` : "0%",
    }));

    return { totalCost, breakdown };
  }

  static calculateTokenBreakdown(models: ModelUsage[]): {
    totalTokens: number;
    breakdown: Array<{ model: string; tokens: number; percentage: string }>;
  } {
    const totalTokens = models.reduce((sum, model) => sum + model.totalTokens, 0);

    const breakdown = models.map((model) => ({
      model: model.model,
      tokens: model.totalTokens,
      percentage: totalTokens > 0 ? `${((model.totalTokens / totalTokens) * 100).toFixed(1)}%` : "0%",
    }));

    return { totalTokens, breakdown };
  }

  static estimateRemainingBudget(
    currentCost: number,
    dailyBudget: number,
    daysInMonth: number,
  ): {
    remainingBudget: number;
    projectedMonthlyCost: number;
    isOverBudget: boolean;
    daysRemaining: number;
  } {
    const today = new Date();
    const daysElapsed = today.getDate();
    const daysRemaining = daysInMonth - daysElapsed;

    const dailyAverage = currentCost / daysElapsed;
    const projectedMonthlyCost = dailyAverage * daysInMonth;
    const remainingBudget = dailyBudget - projectedMonthlyCost;

    return {
      remainingBudget,
      projectedMonthlyCost,
      isOverBudget: projectedMonthlyCost > dailyBudget,
      daysRemaining,
    };
  }

  static getUsageIntensity(tokens: number): "Low" | "Medium" | "High" | "Very High" {
    if (tokens < 10000) return "Low";
    if (tokens < 50000) return "Medium";
    if (tokens < 100000) return "High";
    return "Very High";
  }

  static calculateEfficiencyMetrics(sessions: SessionData[]): {
    averageInputOutputRatio: number;
    averageCostPerOutput: number;
    mostEfficientModel: string | null;
  } {
    if (sessions.length === 0) {
      return {
        averageInputOutputRatio: 0,
        averageCostPerOutput: 0,
        mostEfficientModel: null,
      };
    }

    const totalInputTokens = sessions.reduce((sum, s) => sum + s.inputTokens, 0);
    const totalOutputTokens = sessions.reduce((sum, s) => sum + s.outputTokens, 0);
    const totalCost = sessions.reduce((sum, s) => sum + s.cost, 0);

    const averageInputOutputRatio = totalInputTokens > 0 ? totalOutputTokens / totalInputTokens : 0;
    const averageCostPerOutput = totalOutputTokens > 0 ? totalCost / totalOutputTokens : 0;

    // Find most efficient model (lowest cost per output token)
    const modelEfficiency = new Map<string, { cost: number; output: number }>();
    sessions.forEach((session) => {
      const existing = modelEfficiency.get(session.model) || { cost: 0, output: 0 };
      existing.cost += session.cost;
      existing.output += session.outputTokens;
      modelEfficiency.set(session.model, existing);
    });

    let mostEfficientModel: string | null = null;
    let bestEfficiency = Infinity;

    modelEfficiency.forEach((stats, model) => {
      if (stats.output > 0) {
        const efficiency = stats.cost / stats.output;
        if (efficiency < bestEfficiency) {
          bestEfficiency = efficiency;
          mostEfficientModel = model;
        }
      }
    });

    return {
      averageInputOutputRatio,
      averageCostPerOutput,
      mostEfficientModel,
    };
  }
}
