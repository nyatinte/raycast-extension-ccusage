import { List, Icon, ActionPanel, Action, Color } from "@raycast/api";
import { DailyUsageData } from "../types/usage-types";
import { formatTokens, formatCost, formatDate, getTokenEfficiency, getCostPerMTok } from "../utils/data-formatter";
import { getUsageIntensity } from "../utils/usage-calculator";
import { ReactNode } from "react";

type DailyUsageProps = {
  dailyUsage: DailyUsageData | null;
  isLoading: boolean;
  error?: string;
  settingsActions?: ReactNode;
};

export default function DailyUsage({ dailyUsage, isLoading, error, settingsActions }: DailyUsageProps) {
  const getTrendIcon = (usage: DailyUsageData | null) => {
    if (!usage) return Icon.Calendar;

    const intensity = getUsageIntensity(usage.totalTokens);
    switch (intensity) {
      case "Low":
        return Icon.Circle;
      case "Medium":
        return Icon.CircleProgress25;
      case "High":
        return Icon.CircleProgress75;
      case "Very High":
        return Icon.CircleProgress100;
      default:
        return Icon.Calendar;
    }
  };

  const getTrendColor = (usage: DailyUsageData | null) => {
    if (!usage) return Color.SecondaryText;

    const intensity = getUsageIntensity(usage.totalTokens);
    switch (intensity) {
      case "Low":
        return Color.Green;
      case "Medium":
        return Color.Yellow;
      case "High":
        return Color.Orange;
      case "Very High":
        return Color.Red;
      default:
        return Color.SecondaryText;
    }
  };

  const getDetailMetadata = () => {
    if (error) {
      return (
        <List.Item.Detail.Metadata>
          <List.Item.Detail.Metadata.Label title="Error" text={error} icon={Icon.ExclamationMark} />
        </List.Item.Detail.Metadata>
      );
    }

    if (!dailyUsage) {
      return (
        <List.Item.Detail.Metadata>
          <List.Item.Detail.Metadata.Label title="Status" text="No usage recorded for today" icon={Icon.Calendar} />
          <List.Item.Detail.Metadata.Separator />
          <List.Item.Detail.Metadata.Label title="Date" text={new Date().toLocaleDateString()} />
        </List.Item.Detail.Metadata>
      );
    }

    const efficiency = getTokenEfficiency(dailyUsage.inputTokens, dailyUsage.outputTokens);
    const costPerMTok = getCostPerMTok(dailyUsage.cost, dailyUsage.totalTokens);
    const intensity = getUsageIntensity(dailyUsage.totalTokens);

    return (
      <List.Item.Detail.Metadata>
        <List.Item.Detail.Metadata.Label title="Date" text={formatDate(dailyUsage.date)} icon={Icon.Calendar} />
        <List.Item.Detail.Metadata.Separator />

        <List.Item.Detail.Metadata.Label title="Token Usage" />
        <List.Item.Detail.Metadata.Label title="Input Tokens" text={formatTokens(dailyUsage.inputTokens)} />
        <List.Item.Detail.Metadata.Label title="Output Tokens" text={formatTokens(dailyUsage.outputTokens)} />
        <List.Item.Detail.Metadata.Label title="Total Tokens" text={formatTokens(dailyUsage.totalTokens)} />
        <List.Item.Detail.Metadata.Separator />

        <List.Item.Detail.Metadata.Label title="Cost Analysis" />
        <List.Item.Detail.Metadata.Label title="Total Cost" text={formatCost(dailyUsage.cost)} icon={Icon.Coins} />
        <List.Item.Detail.Metadata.Label title="Cost per MTok" text={costPerMTok} />
        <List.Item.Detail.Metadata.Separator />

        <List.Item.Detail.Metadata.Label title="Efficiency Metrics" />
        <List.Item.Detail.Metadata.Label title="Output/Input Ratio" text={efficiency} />
        <List.Item.Detail.Metadata.Label
          title="Usage Intensity"
          text={intensity}
          icon={{ source: getTrendIcon(dailyUsage), tintColor: getTrendColor(dailyUsage) }}
        />
      </List.Item.Detail.Metadata>
    );
  };

  const getAccessories = () => {
    if (error) {
      return [{ text: "Error", icon: { source: Icon.ExclamationMark, tintColor: Color.Red } }];
    }

    if (!dailyUsage) {
      return [{ text: "No usage today", icon: Icon.Calendar }];
    }

    return [{ text: formatCost(dailyUsage.cost), icon: Icon.Coins }];
  };

  return (
    <List.Item
      id="daily"
      title={dailyUsage ? `Today (${formatDate(dailyUsage.date)})` : "Today"}
      icon={{ source: getTrendIcon(dailyUsage), tintColor: getTrendColor(dailyUsage) }}
      accessories={getAccessories()}
      detail={<List.Item.Detail isLoading={isLoading} metadata={getDetailMetadata()} />}
      actions={
        <ActionPanel>
          {settingsActions}
          <Action.OpenInBrowser title="Open Claude Code" url="https://claude.ai/code" icon={Icon.Globe} />
          <Action.OpenInBrowser
            title="View Ccusage Repository"
            url="https://github.com/ryoppippi/ccusage"
            icon={Icon.Code}
          />
        </ActionPanel>
      }
    />
  );
}
