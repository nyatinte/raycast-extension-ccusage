export interface DailyUsageData {
  date: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
}

export interface SessionData {
  sessionId: string;
  startTime: string;
  endTime?: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  model: string;
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
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  date?: string;
  sessions?: SessionData[];
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