import { SessionData, ModelUsage } from "../types/usage-types";

export const getTopModels = (models: ModelUsage[], limit: number = 5): ModelUsage[] => {
  return models.sort((a, b) => b.totalTokens - a.totalTokens).slice(0, limit);
};

export const getRecentSessions = (sessions: SessionData[], limit: number = 10): SessionData[] => {
  return sessions
    .sort(
      (a, b) => new Date(b.startTime || b.lastActivity).getTime() - new Date(a.startTime || a.lastActivity).getTime(),
    )
    .slice(0, limit);
};

export const getUsageIntensity = (tokens: number): "Low" | "Medium" | "High" | "Very High" => {
  if (tokens < 10000) return "Low";
  if (tokens < 50000) return "Medium";
  if (tokens < 100000) return "High";
  return "Very High";
};

export const calculateAverageSessionCost = (sessions: SessionData[]): number => {
  if (sessions.length === 0) return 0;
  const totalCost = sessions.reduce((sum, session) => sum + session.cost, 0);
  return totalCost / sessions.length;
};

export const calculateAverageSessionTokens = (sessions: SessionData[]): number => {
  if (sessions.length === 0) return 0;
  const totalTokens = sessions.reduce((sum, session) => sum + session.totalTokens, 0);
  return totalTokens / sessions.length;
};

export const calculateModelUsage = (sessions: SessionData[]): ModelUsage[] => {
  const modelMap = new Map<string, ModelUsage>();

  sessions.forEach((session) => {
    const model = session.model || "unknown";
    const existing = modelMap.get(model) || {
      model,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      cost: 0,
      sessionCount: 0,
    };

    existing.inputTokens += session.inputTokens || 0;
    existing.outputTokens += session.outputTokens || 0;
    existing.totalTokens += session.totalTokens || 0;
    existing.cost += session.cost || 0;
    existing.sessionCount += 1;

    modelMap.set(model, existing);
  });

  return Array.from(modelMap.values()).sort((a, b) => b.totalTokens - a.totalTokens);
};

export const calculateEfficiencyMetrics = (
  sessions: SessionData[],
): {
  averageInputOutputRatio: number;
  averageCostPerOutput: number;
  mostEfficientModel: string | null;
} => {
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
    const model = session.model || "unknown";
    const existing = modelEfficiency.get(model) || { cost: 0, output: 0 };
    existing.cost += session.cost;
    existing.output += session.outputTokens;
    modelEfficiency.set(model, existing);
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
};
