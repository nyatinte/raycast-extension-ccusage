export interface DailyUsageData {
  date: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens?: number;
  cacheReadTokens?: number;
  totalTokens: number;
  totalCost?: number;
  cost: number; // For compatibility, derived from totalCost
}

export interface SessionData {
  sessionId: string;
  projectPath: string;
  lastActivity: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens?: number;
  cacheReadTokens?: number;
  totalTokens: number;
  totalCost: number;
  cost: number; // Alias for totalCost for compatibility
  model?: string; // Optional since ccusage doesn't provide this
  startTime?: string; // Derived from lastActivity for compatibility
  endTime?: string;
  projectName?: string;
}

export interface ModelUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  sessionCount: number;
}

export interface UsageData {
  daily: DailyUsageData | null;
  total: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
  } | null;
  sessions: SessionData[];
  models: ModelUsage[];
  error?: string;
  lastUpdated: string;
}

export interface CCUsageCommandResult {
  stdout: string;
  stderr: string;
}

export interface CCUsageOutput {
  daily?: DailyUsageData[];
  sessions?: SessionData[];
  totals?: {
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens?: number;
    cacheReadTokens?: number;
    totalTokens: number;
    totalCost: number;
  };
  // Legacy fields for compatibility
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  cost?: number;
  date?: string;
}

export interface UsageStats {
  todayUsage: DailyUsageData | null;
  totalUsage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
  } | null;
  recentSessions: SessionData[];
  topModels: ModelUsage[];
  isLoading: boolean;
  error?: string;
}
