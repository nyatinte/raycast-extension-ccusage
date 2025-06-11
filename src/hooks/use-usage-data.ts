import { usePromise } from "@raycast/utils";
import { useInterval } from "usehooks-ts";
import { CCUsageIntegration } from "../utils/ccusage-integration";
import { UsageData, UsageStats } from "../types/usage-types";
import { UsageCalculator } from "../utils/usage-calculator";

export function useUsageData() {
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

  return {
    data,
    isLoading,
    error,
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
  const { data, isLoading, error, revalidate } = usePromise(async () => {
    return await CCUsageIntegration.getAllUsageData();
  }, []);

  // Enable automatic refresh only for MenuBar (1000ms interval), disable for main view
  if (refreshInterval <= 1000) {
    useInterval(() => {
      revalidate();
    }, refreshInterval);
  }

  const stats: UsageStats = {
    todayUsage: data?.daily || null,
    totalUsage: data?.total || null,
    recentSessions: data?.sessions ? UsageCalculator.getRecentSessions(data.sessions, 5) : [],
    topModels: data?.models ? UsageCalculator.getTopModels(data.models, 3) : [],
    isLoading,
    error: error?.message || (data as unknown as { error?: string })?.error,
  };

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
  }, []);

  useInterval(() => {
    revalidate();
  }, refreshInterval);

  return { data, isLoading, error, revalidate };
}
