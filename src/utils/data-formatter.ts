export class DataFormatter {
  static formatTokens(tokens: number | null | undefined): string {
    if (tokens === null || tokens === undefined) return "0";

    if (tokens < 1000) {
      return tokens.toString();
    } else if (tokens < 1000000) {
      return `${(tokens / 1000).toFixed(1)}K`;
    } else {
      return `${(tokens / 1000000).toFixed(1)}M`;
    }
  }

  static formatCost(cost: number | null | undefined): string {
    if (cost === null || cost === undefined) return "$0.00";

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(cost);
  }

  static formatPercentage(value: number, total: number): string {
    if (total === 0) return "0%";
    return `${((value / total) * 100).toFixed(1)}%`;
  }

  static formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date);
    } catch {
      return dateString;
    }
  }

  static formatDateTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return dateString;
    }
  }

  static formatRelativeTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return this.formatDate(dateString);
    } catch {
      return dateString;
    }
  }

  static formatModelName(model: string | null | undefined): string {
    if (!model) return "Unknown Model";

    const modelNames: Record<string, string> = {
      "claude-3-5-sonnet-20241022": "Claude 3.5 Sonnet",
      "claude-3-5-sonnet-20240620": "Claude 3.5 Sonnet (Legacy)",
      "claude-3-opus-20240229": "Claude 3 Opus",
      "claude-3-sonnet-20240229": "Claude 3 Sonnet",
      "claude-3-haiku-20240307": "Claude 3 Haiku",
    };

    return modelNames[model] || model;
  }

  static getTokenEfficiency(inputTokens: number, outputTokens: number): string {
    if (inputTokens === 0) return "N/A";
    const ratio = outputTokens / inputTokens;
    return `${ratio.toFixed(2)}x`;
  }

  static getCostPerToken(cost: number, totalTokens: number): string {
    if (totalTokens === 0) return "$0.000";
    const costPerToken = cost / totalTokens;
    return `$${costPerToken.toFixed(6)}`;
  }

  static formatTodaysDate(): string {
    const today = new Date();
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(today);
  }
}
