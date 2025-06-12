import { z } from "zod";

// Base schemas
export const DailyUsageDataSchema = z.object({
  date: z.string(),
  inputTokens: z.number(),
  outputTokens: z.number(),
  cacheCreationTokens: z.number().optional(),
  cacheReadTokens: z.number().optional(),
  totalTokens: z.number(),
  totalCost: z.number().optional(),
  cost: z.number(), // For compatibility, derived from totalCost
});

export const SessionDataSchema = z.object({
  sessionId: z.string(),
  projectPath: z.string(),
  lastActivity: z.string(),
  inputTokens: z.number(),
  outputTokens: z.number(),
  cacheCreationTokens: z.number().optional(),
  cacheReadTokens: z.number().optional(),
  totalTokens: z.number(),
  totalCost: z.number(),
  cost: z.number(), // Alias for totalCost for compatibility
  modelsUsed: z.array(z.string()).optional(), // From ccusage
  modelBreakdowns: z
    .array(
      z.object({
        modelName: z.string(), // ccusage uses modelName, not model
        inputTokens: z.number(),
        outputTokens: z.number(),
        cacheCreationTokens: z.number().optional(),
        cacheReadTokens: z.number().optional(),
        cost: z.number(),
      }),
    )
    .optional(),
  model: z.string().optional(), // Derived field for UI compatibility
  startTime: z.string().optional(), // Derived from lastActivity for compatibility
  endTime: z.string().optional(),
  projectName: z.string().optional(),
});

export const ModelUsageSchema = z.object({
  model: z.string(),
  inputTokens: z.number(),
  outputTokens: z.number(),
  totalTokens: z.number(),
  cost: z.number(),
  sessionCount: z.number(),
});

export const MonthlyUsageDataSchema = z.object({
  month: z.string(),
  inputTokens: z.number(),
  outputTokens: z.number(),
  cacheCreationTokens: z.number().optional(),
  cacheReadTokens: z.number().optional(),
  totalTokens: z.number(),
  totalCost: z.number(),
  cost: z.number(), // Alias for totalCost for compatibility
  modelsUsed: z.array(z.string()).optional(),
  modelBreakdowns: z
    .array(
      z.object({
        modelName: z.string(),
        inputTokens: z.number(),
        outputTokens: z.number(),
        cacheCreationTokens: z.number().optional(),
        cacheReadTokens: z.number().optional(),
        cost: z.number(),
      }),
    )
    .optional(),
});

export const TotalUsageSchema = z.object({
  inputTokens: z.number(),
  outputTokens: z.number(),
  totalTokens: z.number(),
  cost: z.number(),
});

export const UsageDataSchema = z.object({
  daily: DailyUsageDataSchema.nullable(),
  total: TotalUsageSchema.nullable(),
  sessions: z.array(SessionDataSchema),
  models: z.array(ModelUsageSchema),
  error: z.string().optional(),
  lastUpdated: z.string(),
});

export const CCUsageCommandResultSchema = z.object({
  stdout: z.string(),
  stderr: z.string(),
});

export const CCUsageOutputSchema = z.object({
  daily: z.array(DailyUsageDataSchema).optional(),
  monthly: z.array(MonthlyUsageDataSchema).optional(),
  sessions: z.array(SessionDataSchema).optional(),
  totals: z
    .object({
      inputTokens: z.number(),
      outputTokens: z.number(),
      cacheCreationTokens: z.number().optional(),
      cacheReadTokens: z.number().optional(),
      totalTokens: z.number(),
      totalCost: z.number(),
    })
    .optional(),
  // Legacy fields for compatibility
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
  totalTokens: z.number().optional(),
  cost: z.number().optional(),
  date: z.string().optional(),
});

export const UsageStatsSchema = z.object({
  todayUsage: DailyUsageDataSchema.nullable(),
  totalUsage: TotalUsageSchema.nullable(),
  recentSessions: z.array(SessionDataSchema),
  topModels: z.array(ModelUsageSchema),
  isLoading: z.boolean(),
  error: z.string().optional(),
});

// Export types inferred from schemas
export type DailyUsageData = z.infer<typeof DailyUsageDataSchema>;
export type MonthlyUsageData = z.infer<typeof MonthlyUsageDataSchema>;
export type SessionData = z.infer<typeof SessionDataSchema>;
export type ModelUsage = z.infer<typeof ModelUsageSchema>;
export type TotalUsage = z.infer<typeof TotalUsageSchema>;
export type UsageData = z.infer<typeof UsageDataSchema>;
export type CCUsageCommandResult = z.infer<typeof CCUsageCommandResultSchema>;
export type CCUsageOutput = z.infer<typeof CCUsageOutputSchema>;
export type UsageStats = z.infer<typeof UsageStatsSchema>;

// Validation helpers
export const validateDailyUsage = (data: unknown): DailyUsageData | null => {
  const result = DailyUsageDataSchema.safeParse(data);
  return result.success ? result.data : null;
};

export const validateCCUsageOutput = (data: unknown): CCUsageOutput | null => {
  const result = CCUsageOutputSchema.safeParse(data);
  return result.success ? result.data : null;
};

export const validateSessionData = (data: unknown[]): SessionData[] => {
  return data
    .map((item) => SessionDataSchema.safeParse(item))
    .filter((result) => result.success)
    .map((result) => result.data as SessionData);
};
