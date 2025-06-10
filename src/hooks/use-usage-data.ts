import { usePromise } from "@raycast/utils";
import { useInterval } from "usehooks-ts";
import { CCUsageIntegration } from "../utils/ccusage-integration";
import { UsageData, UsageStats } from "../types/usage-types";
import { UsageCalculator } from "../utils/usage-calculator";

export function useUsageData(refreshInterval: number = 5000) {
  const { data, isLoading, error, revalidate } = usePromise<UsageData>(
    async () => {
      return CCUsageIntegration.getAllUsageData();
    },
    [],
    {
      initialData: {
        daily: null,
        total: null,
        sessions: [],
        models: [],
        lastUpdated: new Date().toISOString(),
      },
    },
  );

  useInterval(() => {
    revalidate();
  }, refreshInterval);

  return {
    data,
    isLoading,
    error: error || data?.error,
    revalidate,
  };
}

export function useDailyUsage(refreshInterval: number = 10000) {
  const { data, isLoading, error, revalidate } = usePromise(async () => {
    return CCUsageIntegration.getDailyUsage();
  }, []);

  useInterval(() => {
    revalidate();
  }, refreshInterval);

  return { data, isLoading, error, revalidate };
}

export function useTotalUsage(refreshInterval: number = 30000) {
  const { data, isLoading, error, revalidate } = usePromise(async () => {
    return CCUsageIntegration.getTotalUsage();
  }, []);

  useInterval(() => {
    revalidate();
  }, refreshInterval);

  return { data, isLoading, error, revalidate };
}

export function useSessionUsage(refreshInterval: number = 15000) {
  const { data, isLoading, error, revalidate } = usePromise(async () => {
    return CCUsageIntegration.getSessionUsage();
  }, []);

  useInterval(() => {
    revalidate();
  }, refreshInterval);

  return { data, isLoading, error, revalidate };
}

export function useUsageStats(refreshInterval: number = 5000): UsageStats & { revalidate: () => void } {
  console.log(`[DEBUG] useUsageStats: Hook initialized with refresh interval ${refreshInterval}ms`);
  
  const { data, isLoading, error, revalidate } = usePromise<UsageData>(
    async () => {
      console.log(`[DEBUG] useUsageStats: Fetching usage data...`);
      const result = await CCUsageIntegration.getAllUsageData();
      console.log(`[DEBUG] useUsageStats: Received data:`, result);
      return result;
    },
    [],
    {
      initialData: {
        daily: null,
        total: null,
        sessions: [],
        models: [],
        lastUpdated: new Date().toISOString(),
      },
    },
  );

  useInterval(() => {
    console.log(`[DEBUG] useUsageStats: Interval triggered, revalidating...`);
    revalidate();
  }, refreshInterval);

  console.log(`[DEBUG] useUsageStats: Current state:`, {
    isLoading,
    hasError: !!error,
    hasData: !!data,
    dataDaily: data?.daily,
    dataTotal: data?.total,
    sessionsLength: data?.sessions?.length || 0,
    modelsLength: data?.models?.length || 0
  });

  const stats: UsageStats = {
    todayUsage: data?.daily || null,
    totalUsage: data?.total || null,
    recentSessions: data?.sessions ? UsageCalculator.getRecentSessions(data.sessions, 5) : [],
    topModels: data?.models ? UsageCalculator.getTopModels(data.models, 3) : [],
    isLoading,
    error: error?.message || data?.error,
  };

  console.log(`[DEBUG] useUsageStats: Processed stats:`, {
    hasTodayUsage: !!stats.todayUsage,
    hasTotalUsage: !!stats.totalUsage,
    recentSessionsCount: stats.recentSessions.length,
    topModelsCount: stats.topModels.length,
    error: stats.error
  });

  return {
    ...stats,
    revalidate,
  };
}

export function useCCUsageAvailability() {
  const {
    data: isAvailable,
    isLoading,
    error,
    revalidate,
  } = usePromise(async () => {
    return CCUsageIntegration.checkCCUsageAvailable();
  }, []);

  return {
    isAvailable: isAvailable ?? false,
    isLoading,
    error,
    revalidate,
  };
}

export function useUsageByPeriod(since: string, until?: string, refreshInterval: number = 60000) {
  const { data, isLoading, error, revalidate } = usePromise(async () => {
    return CCUsageIntegration.getUsageByPeriod(since, until);
  }, [since, until]);

  useInterval(() => {
    revalidate();
  }, refreshInterval);

  return { data, isLoading, error, revalidate };
}
