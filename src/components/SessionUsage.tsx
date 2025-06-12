import { List, Icon, ActionPanel, Action, getPreferenceValues, openExtensionPreferences, Color } from "@raycast/api";
import { ReactNode } from "react";
import { SessionData, Preferences } from "../types/usage-types";
import { formatTokens, formatCost, formatRelativeTimeWithTimezone, formatModelName } from "../utils/data-formatter";
import {
  calculateAverageSessionCost,
  calculateAverageSessionTokens,
  calculateEfficiencyMetrics,
} from "../utils/usage-calculator";

type SessionUsageProps = {
  sessions: SessionData[];
  isLoading: boolean;
  error?: string;
  settingsActions?: ReactNode;
};

export default function SessionUsage({ sessions, isLoading, error, settingsActions }: SessionUsageProps) {
  const preferences = getPreferenceValues<Preferences>();
  const getDetailMetadata = (): ReactNode => {
    if (error) {
      return (
        <List.Item.Detail.Metadata>
          <List.Item.Detail.Metadata.Label title="エラー" text="ccusageが利用できません" icon={Icon.ExclamationMark} />
          <List.Item.Detail.Metadata.Label
            title="解決方法"
            text="PreferencesでJavaScriptランタイムを設定してください"
          />
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
            title={session.sessionId}
            text={`${formatTokens(session.totalTokens)} • ${formatCost(session.cost)} • ${formatRelativeTimeWithTimezone(session.startTime || session.lastActivity, preferences.timezone)}`}
          />
        ))}
      </List.Item.Detail.Metadata>
    );
  };

  const getAccessories = (): List.Item.Accessory[] => {
    if (error) {
      return [{ text: "設定が必要", icon: { source: Icon.ExclamationMark, tintColor: Color.Red } }];
    }

    if (!sessions || sessions.length === 0) {
      return [{ text: "No sessions", icon: Icon.Circle }];
    }

    return [{ text: `${sessions.length} sessions`, icon: Icon.List }];
  };

  return (
    <List.Item
      id="sessions"
      title="Sessions"
      icon={Icon.List}
      accessories={getAccessories()}
      detail={<List.Item.Detail isLoading={isLoading} metadata={getDetailMetadata()} />}
      actions={
        <ActionPanel>
          {error && (
            <Action
              title="Preferencesで設定する"
              icon={Icon.Gear}
              onAction={openExtensionPreferences}
              shortcut={{ modifiers: ["cmd", "shift"], key: "," }}
            />
          )}
          {settingsActions}
          <Action.OpenInBrowser title="Open Claude Code" url="https://claude.ai/code" icon={Icon.Globe} />
          <Action.OpenInBrowser title="View Session Data" url="https://claude.ai/code" icon={Icon.Clock} />
        </ActionPanel>
      }
    />
  );
}
