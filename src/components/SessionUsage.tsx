import { List, Icon, ActionPanel, Action, Color } from "@raycast/api";
import { SessionData } from "../types/usage-types";
import { DataFormatter } from "../utils/data-formatter";
import { UsageCalculator } from "../utils/usage-calculator";

interface SessionUsageProps {
  sessions: SessionData[];
  isLoading: boolean;
  error?: string;
}

export default function SessionUsage({ sessions, isLoading, error }: SessionUsageProps) {
  const getSessionIcon = (session: SessionData) => {
    const model = session.model || "";
    if (model.includes("opus")) return Icon.Crown;
    if (model.includes("sonnet")) return Icon.Sparkles;
    if (model.includes("haiku")) return Icon.Leaf;
    return Icon.Message;
  };

  const getSessionIconColor = (session: SessionData) => {
    const model = session.model || "";
    if (model.includes("opus")) return Color.Purple;
    if (model.includes("sonnet")) return Color.Blue;
    if (model.includes("haiku")) return Color.Green;
    return Color.SecondaryText;
  };

  const getAccessories = () => {
    if (error) {
      return [{ text: "Error", icon: { source: Icon.ExclamationMark, tintColor: Color.Red } }];
    }

    if (!sessions || sessions.length === 0) {
      return [{ text: "No sessions", icon: Icon.Circle }];
    }

    const totalSessions = sessions.length;
    const totalCost = sessions.reduce((sum, session) => sum + session.cost, 0);

    return [
      { text: `${totalSessions} sessions`, icon: Icon.List },
      { text: DataFormatter.formatCost(totalCost), icon: Icon.Coins },
    ];
  };

  const getDetailMetadata = () => {
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

    const averageCost = UsageCalculator.calculateAverageSessionCost(sessions);
    const averageTokens = UsageCalculator.calculateAverageSessionTokens(sessions);
    const efficiency = UsageCalculator.calculateEfficiencyMetrics(sessions);

    return (
      <List.Item.Detail.Metadata>
        <List.Item.Detail.Metadata.Label
          title="Recent Sessions"
          text={`${sessions.length} sessions`}
          icon={Icon.List}
        />
        <List.Item.Detail.Metadata.Separator />

        <List.Item.Detail.Metadata.Label title="Session Statistics" />
        <List.Item.Detail.Metadata.Label
          title="Average Cost per Session"
          text={DataFormatter.formatCost(averageCost)}
        />
        <List.Item.Detail.Metadata.Label
          title="Average Tokens per Session"
          text={DataFormatter.formatTokens(averageTokens)}
        />
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
            text={DataFormatter.formatModelName(efficiency.mostEfficientModel)}
          />
        )}
        <List.Item.Detail.Metadata.Separator />

        <List.Item.Detail.Metadata.Label title="Latest Sessions" />
        {sessions.slice(0, 5).map((session, index) => (
          <List.Item.Detail.Metadata.Label
            key={session.sessionId || index}
            title={`Session ${index + 1}`}
            text={`${DataFormatter.formatModelName(session.model)} • ${DataFormatter.formatTokens(session.totalTokens)} • ${DataFormatter.formatCost(session.cost)} • ${DataFormatter.formatRelativeTime(session.startTime)}`}
            icon={{ source: getSessionIcon(session), tintColor: getSessionIconColor(session) }}
          />
        ))}
      </List.Item.Detail.Metadata>
    );
  };

  return (
    <List.Item
      id="sessions"
      title="Sessions"
      subtitle={sessions && sessions.length > 0 ? `${sessions.length} sessions` : "No sessions"}
      icon={Icon.List}
      accessories={getAccessories()}
      detail={<List.Item.Detail isLoading={isLoading} metadata={getDetailMetadata()} />}
      actions={
        <ActionPanel>
          <Action.OpenInBrowser title="Open Claude Code" url="https://claude.ai/code" icon={Icon.Globe} />
          <Action.OpenInBrowser title="View Session Data" url="https://claude.ai/code" icon={Icon.Clock} />
        </ActionPanel>
      }
    />
  );
}
