import { List, Icon, ActionPanel, Action } from "@raycast/api";
import { ReactNode } from "react";
import { SessionData } from "../types/usage-types";
import { formatTokens, formatCost, formatRelativeTime, formatModelName } from "../utils/data-formatter";
import {
  calculateAverageSessionCost,
  calculateAverageSessionTokens,
  calculateEfficiencyMetrics,
} from "../utils/usage-calculator";
import { getModelIcon, getModelIconColor } from "../utils/model-utils";

type SessionUsageProps = {
  sessions: SessionData[];
  isLoading: boolean;
  error?: string;
  settingsActions?: ReactNode;
};

export default function SessionUsage({ sessions, isLoading, error, settingsActions }: SessionUsageProps) {
  const getDetailMetadata = (): ReactNode => {
    if (error) {
      return (
        <List.Item.Detail.Metadata>
          <List.Item.Detail.Metadata.Label title="Error" text={error} icon={Icon.ExclamationMark} />
        </List.Item.Detail.Metadata>
      );
    }

    if (!sessions || sessions.length === 0) {
      return (
        <List.Item.Detail.Metadata>
          <List.Item.Detail.Metadata.Label title="Status" text="No recent sessions found" icon={Icon.Circle} />
          <List.Item.Detail.Metadata.Separator />
          <List.Item.Detail.Metadata.Label title="Note" text="Sessions will appear here after using Claude Code" />
        </List.Item.Detail.Metadata>
      );
    }

    const averageCost = calculateAverageSessionCost(sessions);
    const averageTokens = calculateAverageSessionTokens(sessions);
    const efficiency = calculateEfficiencyMetrics(sessions);

    return (
      <List.Item.Detail.Metadata>
        <List.Item.Detail.Metadata.Label
          title="Recent Sessions"
          text={`${sessions.length} sessions`}
          icon={Icon.List}
        />
        <List.Item.Detail.Metadata.Separator />

        <List.Item.Detail.Metadata.Label title="Session Statistics" />
        <List.Item.Detail.Metadata.Label title="Average Cost per Session" text={formatCost(averageCost)} />
        <List.Item.Detail.Metadata.Label title="Average Tokens per Session" text={formatTokens(averageTokens)} />
        <List.Item.Detail.Metadata.Separator />

        <List.Item.Detail.Metadata.Label title="Efficiency Metrics" />
        <List.Item.Detail.Metadata.Label
          title="Avg Input/Output Ratio"
          text={`${efficiency.averageInputOutputRatio.toFixed(2)}x`}
        />
        <List.Item.Detail.Metadata.Label
          title="Cost per Output Token"
          text={`$${efficiency.averageCostPerOutput.toFixed(6)}`}
        />
        {efficiency.mostEfficientModel && (
          <List.Item.Detail.Metadata.Label
            title="Most Efficient Model"
            text={formatModelName(efficiency.mostEfficientModel)}
          />
        )}
        <List.Item.Detail.Metadata.Separator />

        <List.Item.Detail.Metadata.Label title="Latest Sessions" />
        {sessions.slice(0, 5).map((session, index) => (
          <List.Item.Detail.Metadata.Label
            key={session.sessionId || index}
            title={`Session ${index + 1}`}
            text={`${formatModelName(session.model)} • ${formatTokens(session.totalTokens)} • ${formatCost(session.cost)} • ${formatRelativeTime(session.startTime || session.lastActivity)}`}
            icon={{ source: getModelIcon(session.model || ""), tintColor: getModelIconColor(session.model || "") }}
          />
        ))}
      </List.Item.Detail.Metadata>
    );
  };

  return (
    <List.Item
      id="sessions"
      title="Sessions"
      icon={Icon.List}
      detail={<List.Item.Detail isLoading={isLoading} metadata={getDetailMetadata()} />}
      actions={
        <ActionPanel>
          {settingsActions}
          <Action.OpenInBrowser title="Open Claude Code" url="https://claude.ai/code" icon={Icon.Globe} />
          <Action.OpenInBrowser title="View Session Data" url="https://claude.ai/code" icon={Icon.Clock} />
        </ActionPanel>
      }
    />
  );
}
