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

export const formatDateTime = (dateString: string): string => {
  const date = parseISO(dateString);
  return isValid(date) ? format(date, "MMM dd, yyyy HH:mm") : dateString;
};

export const formatRelativeTime = (dateString: string): string => {
  const date = parseISO(dateString);
  return isValid(date) ? formatDistanceToNow(date, { addSuffix: true }) : dateString;
};

export const formatModelName = (model: string | null | undefined): string => {
  if (!model) return "Unknown Model";

  return match(model)
    .with("claude-opus-4-20250514", "claude-opus-4-0", () => "Claude Opus 4")
    .with("claude-sonnet-4-20250514", "claude-sonnet-4-0", () => "Claude Sonnet 4")
    .with("claude-3-5-sonnet-20241022", () => "Claude 3.5 Sonnet")
    .with("claude-3-5-sonnet-20240620", () => "Claude 3.5 Sonnet (Legacy)")
    .with("claude-3-opus-20240229", () => "Claude 3 Opus")
    .with("claude-3-sonnet-20240229", () => "Claude 3 Sonnet")
    .with("claude-3-haiku-20240307", () => "Claude 3 Haiku")
    .otherwise(() => model);
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

export const formatTodaysDate = (): string => {
  return format(new Date(), "yyyy/MM/dd");
};
