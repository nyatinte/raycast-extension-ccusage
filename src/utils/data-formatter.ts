import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";
import { match } from "ts-pattern";

export const formatTokens = (tokens: number | null | undefined): string => {
  if (tokens === null || tokens === undefined) return "0";

  return match(tokens)
    .when(
      (t) => t < 1000,
      (t) => t.toString(),
    )
    .when(
      (t) => t < 1000000,
      (t) => `${(t / 1000).toFixed(1)}K`,
    )
    .otherwise((t) => `${(t / 1000000).toFixed(1)}M`);
};

export const formatTokensAsMTok = (tokens: number | null | undefined): string => {
  if (tokens === null || tokens === undefined) return "0 MTok";

  const mTokens = tokens / 1000000;
  return `${mTokens.toFixed(1)} MTok`;
};

export const formatCost = (cost: number | null | undefined): string => {
  if (cost === null || cost === undefined) return "$0.0";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(cost);
};

export const formatDate = (dateString: string): string => {
  const date = parseISO(dateString);
  return isValid(date) ? format(date, "yyyy/MM/dd") : dateString;
};

export const formatRelativeTime = (dateString: string): string => {
  const date = parseISO(dateString);
  return isValid(date) ? formatDistanceToNow(date, { addSuffix: true }) : dateString;
};

/**
 * @see https://docs.anthropic.com/en/docs/about-claude/models/overview#model-names
 */
export const formatModelName = (model: string | null | undefined): string => {
  if (!model) return "Unknown Model";

  return match(model)
    .with("claude-opus-4-20250514", "claude-opus-4-0", () => "Claude Opus 4")
    .with("claude-sonnet-4-20250514", "claude-sonnet-4-0", () => "Claude Sonnet 4")
    .with("claude-3-7-sonnet-20250219", () => "Claude 3.7 Sonnet")
    .with("claude-3-5-sonnet-20241022", () => "Claude 3.5 Sonnet")
    .with("claude-3-5-sonnet-20240620", () => "Claude 3.5 Sonnet (Legacy)")
    .with("claude-3-5-haiku-20241022", () => "Claude 3.5 Haiku")
    .with("claude-3-opus-20240229", () => "Claude 3 Opus")
    .with("claude-3-sonnet-20240229", () => "Claude 3 Sonnet")
    .with("claude-3-haiku-20240307", () => "Claude 3 Haiku")
    .otherwise(() => "Unknown Model");
};

export const getTokenEfficiency = (inputTokens: number, outputTokens: number): string => {
  if (inputTokens === 0) return "N/A";
  const ratio = outputTokens / inputTokens;
  return `${ratio.toFixed(2)}x`;
};

export const getCostPerMTok = (cost: number, totalTokens: number): string => {
  if (totalTokens === 0) return "$0.00/MTok";
  const costPerMTok = (cost / totalTokens) * 1000000;
  return `$${costPerMTok.toFixed(2)}/MTok`;
};

// Timezone utilities
export const formatDateWithTimezone = (dateString: string, timezone: string = "UTC"): string => {
  // First try parseISO
  let date = parseISO(dateString);
  
  // If parseISO fails, try parsing as a regular date
  if (!isValid(date)) {
    date = new Date(dateString);
  }
  
  // If still invalid, return the original string
  if (!isValid(date)) return dateString;

  // Convert to target timezone by adjusting the time
  const offsetMinutes = getTimezoneOffset(timezone);
  const adjustedDate = new Date(date.getTime() + offsetMinutes * 60 * 1000);

  return format(adjustedDate, "yyyy/MM/dd HH:mm");
};

export const formatRelativeTimeWithTimezone = (dateString: string, timezone: string = "UTC"): string => {
  // First try parseISO
  let date = parseISO(dateString);
  
  // If parseISO fails, try parsing as a regular date
  if (!isValid(date)) {
    date = new Date(dateString);
  }
  
  // If still invalid, return the original string
  if (!isValid(date)) return dateString;

  // Convert to target timezone by adjusting the time
  const offsetMinutes = getTimezoneOffset(timezone);
  const adjustedDate = new Date(date.getTime() + offsetMinutes * 60 * 1000);

  return formatDistanceToNow(adjustedDate, { addSuffix: true });
};

// Simple timezone offset calculation for common timezones
const getTimezoneOffset = (timezone: string): number => {
  return (
    match(timezone)
      .with("UTC", () => 0)
      // Asia
      .with("Asia/Tokyo", () => 9 * 60) // UTC+9
      .with("Asia/Shanghai", () => 8 * 60) // UTC+8
      .with("Asia/Seoul", () => 9 * 60) // UTC+9
      .with("Asia/Hong_Kong", () => 8 * 60) // UTC+8
      .with("Asia/Singapore", () => 8 * 60) // UTC+8
      .with("Asia/Bangkok", () => 7 * 60) // UTC+7
      .with("Asia/Dubai", () => 4 * 60) // UTC+4
      .with("Asia/Kolkata", () => 5 * 60 + 30) // UTC+5:30
      // Europe
      .with("Europe/London", () => getCurrentOffset("Europe/London"))
      .with("Europe/Paris", () => getCurrentOffset("Europe/Paris"))
      .with("Europe/Berlin", () => getCurrentOffset("Europe/Berlin"))
      .with("Europe/Rome", () => getCurrentOffset("Europe/Rome"))
      .with("Europe/Amsterdam", () => getCurrentOffset("Europe/Amsterdam"))
      .with("Europe/Stockholm", () => getCurrentOffset("Europe/Stockholm"))
      .with("Europe/Moscow", () => 3 * 60) // UTC+3
      // Americas
      .with("America/New_York", () => getCurrentOffset("America/New_York"))
      .with("America/Chicago", () => getCurrentOffset("America/Chicago"))
      .with("America/Denver", () => getCurrentOffset("America/Denver"))
      .with("America/Los_Angeles", () => getCurrentOffset("America/Los_Angeles"))
      .with("America/Toronto", () => getCurrentOffset("America/Toronto"))
      .with("America/Vancouver", () => getCurrentOffset("America/Vancouver"))
      .with("America/Mexico_City", () => getCurrentOffset("America/Mexico_City"))
      .with("America/Sao_Paulo", () => getCurrentOffset("America/Sao_Paulo"))
      .with("America/Argentina/Buenos_Aires", () => -3 * 60) // UTC-3
      // Australia & Pacific
      .with("Australia/Sydney", () => getCurrentOffset("Australia/Sydney"))
      .with("Australia/Melbourne", () => getCurrentOffset("Australia/Melbourne"))
      .with("Australia/Perth", () => 8 * 60) // UTC+8
      .with("Pacific/Auckland", () => getCurrentOffset("Pacific/Auckland"))
      // Africa
      .with("Africa/Cairo", () => getCurrentOffset("Africa/Cairo"))
      .with("Africa/Johannesburg", () => 2 * 60) // UTC+2
      .otherwise(() => 0)
  );
};

// Get current offset for timezones that observe daylight saving time
const getCurrentOffset = (timezone: string): number => {
  try {
    const now = new Date();
    const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    const targetTime = new Date(utc.toLocaleString("en-US", { timeZone: timezone }));
    return Math.round((targetTime.getTime() - utc.getTime()) / (1000 * 60));
  } catch {
    return 0; // Fallback to UTC if timezone is not supported
  }
};
