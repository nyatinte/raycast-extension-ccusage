import { MenuBarExtra, Icon, Color, open } from "@raycast/api";
import { useEffect, useState } from "react";
import { useUsageStats, useccusageAvailability } from "./hooks/use-usage-data";
import { isInitialized, hasValidRuntimeConfig } from "./utils/runtime-settings";
import { DataFormatter } from "./utils/data-formatter";
import { UsageCalculator } from "./utils/usage-calculator";

export default function MenuBarccusage() {
  const [initialized, setInitialized] = useState(false);
  const [hasValidConfig, setHasValidConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // All hooks must be called at the top level
  const { isAvailable, isLoading: availabilityLoading } = useccusageAvailability();
  const stats = useUsageStats(1000); // 1 second refresh for menu bar

  useEffect(() => {
    const checkInit = async () => {
      try {
        const [initResult, configResult] = await Promise.all([
          isInitialized(),
          hasValidRuntimeConfig()
        ]);
        setInitialized(initResult);
        setHasValidConfig(configResult);
      } catch (error) {
        console.error("Failed to check initialization:", error);
        setInitialized(false);
        setHasValidConfig(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkInit();
  }, []);

  if (availabilityLoading || stats.isLoading || isLoading) {
    return (
      <MenuBarExtra
        icon={{ source: Icon.Clock, tintColor: Color.SecondaryText }}
        tooltip="Loading Claude usage..."
        isLoading={true}
      />
    );
  }

  // 初回設定が必要な場合
  if (!initialized || !hasValidConfig) {
    return (
      <MenuBarExtra
        icon={{ source: Icon.Gear, tintColor: Color.Orange }}
        tooltip="Setup required for Claude usage monitoring"
      >
        <MenuBarExtra.Item
          title="Setup Required"
          onAction={() => open("raycast://extensions/raycast/ccusage/ccusage")}
        />
      </MenuBarExtra>
    );
  }

  if (!isAvailable) {
    return (
      <MenuBarExtra icon={{ source: Icon.ExclamationMark, tintColor: Color.Red }} tooltip="ccusage not available">
        <MenuBarExtra.Item
          title="ccusage not available"
          subtitle="Please install ccusage to monitor Claude usage"
          icon={Icon.ExclamationMark}
          onAction={() => open("https://github.com/ryoppippi/ccusage")}
        />
      </MenuBarExtra>
    );
  }

  if (stats.error) {
    return (
      <MenuBarExtra icon={{ source: Icon.ExclamationMark, tintColor: Color.Red }} tooltip="Error loading usage data">
        <MenuBarExtra.Item title="Error" subtitle={stats.error} icon={Icon.ExclamationMark} />
      </MenuBarExtra>
    );
  }

  const getMenuBarIcon = () => {
    if (!stats.todayUsage) {
      return { source: Icon.Circle, tintColor: Color.SecondaryText };
    }

    const intensity = UsageCalculator.getUsageIntensity(stats.todayUsage.totalTokens);
    switch (intensity) {
      case "Low":
        return { source: Icon.Circle, tintColor: Color.Green };
      case "Medium":
        return { source: Icon.CircleProgress25, tintColor: Color.Yellow };
      case "High":
        return { source: Icon.CircleProgress75, tintColor: Color.Orange };
      case "Very High":
        return { source: Icon.CircleProgress100, tintColor: Color.Red };
      default:
        return { source: Icon.Circle, tintColor: Color.SecondaryText };
    }
  };

  const getTooltip = () => {
    if (!stats.todayUsage) {
      return "No Claude usage today";
    }

    return `Today: ${DataFormatter.formatTokens(stats.todayUsage.totalTokens)} tokens, ${DataFormatter.formatCost(stats.todayUsage.cost)}`;
  };

  return (
    <MenuBarExtra icon={getMenuBarIcon()} tooltip={getTooltip()}>
      <MenuBarExtra.Section title="Today's Usage">
        {stats.todayUsage ? (
          <>
            <MenuBarExtra.Item
              title="Total Tokens"
              subtitle={DataFormatter.formatTokens(stats.todayUsage.totalTokens)}
              icon={Icon.Text}
            />
            <MenuBarExtra.Item
              title="Input Tokens"
              subtitle={DataFormatter.formatTokens(stats.todayUsage.inputTokens)}
              icon={Icon.ArrowDown}
            />
            <MenuBarExtra.Item
              title="Output Tokens"
              subtitle={DataFormatter.formatTokens(stats.todayUsage.outputTokens)}
              icon={Icon.ArrowUp}
            />
            <MenuBarExtra.Item
              title="Cost"
              subtitle={DataFormatter.formatCost(stats.todayUsage.cost)}
              icon={Icon.Coins}
            />
            <MenuBarExtra.Item
              title="Usage Intensity"
              subtitle={UsageCalculator.getUsageIntensity(stats.todayUsage.totalTokens)}
              icon={getMenuBarIcon()}
            />
          </>
        ) : (
          <MenuBarExtra.Item
            title="No usage today"
            subtitle="Start using Claude Code to see metrics"
            icon={Icon.Circle}
          />
        )}
      </MenuBarExtra.Section>

      <MenuBarExtra.Section title="Total Usage">
        {stats.totalUsage ? (
          <>
            <MenuBarExtra.Item
              title="All-time Tokens"
              subtitle={DataFormatter.formatTokens(stats.totalUsage.totalTokens)}
              icon={Icon.Text}
            />
            <MenuBarExtra.Item
              title="All-time Cost"
              subtitle={DataFormatter.formatCost(stats.totalUsage.cost)}
              icon={Icon.Coins}
            />
          </>
        ) : (
          <MenuBarExtra.Item title="No total usage data" icon={Icon.Circle} />
        )}
      </MenuBarExtra.Section>

      <MenuBarExtra.Section title="Recent Activity">
        {stats.recentSessions.length > 0 ? (
          <>
            <MenuBarExtra.Item
              title="Recent Sessions"
              subtitle={`${stats.recentSessions.length} sessions`}
              icon={Icon.List}
            />
            {stats.recentSessions.slice(0, 3).map((session, index) => (
              <MenuBarExtra.Item
                key={session.sessionId || `${session.model}-${index}`}
                title={DataFormatter.formatModelName(session.model)}
                subtitle={`${DataFormatter.formatTokens(session.totalTokens)} • ${DataFormatter.formatCost(session.cost)} • ${DataFormatter.formatRelativeTime(session.startTime || session.lastActivity)}`}
                icon={
                  (session.model || "").includes("opus")
                    ? Icon.Crown
                    : (session.model || "").includes("sonnet")
                      ? Icon.Star
                      : (session.model || "").includes("haiku")
                        ? Icon.Leaf
                        : Icon.Message
                }
              />
            ))}
          </>
        ) : (
          <MenuBarExtra.Item title="No recent sessions" icon={Icon.Circle} />
        )}
      </MenuBarExtra.Section>

      <MenuBarExtra.Section title="Top Models">
        {stats.topModels.length > 0 ? (
          stats.topModels
            .slice(0, 3)
            .map((model, index) => (
              <MenuBarExtra.Item
                key={`top-model-${model.model || "unknown"}-${index}`}
                title={DataFormatter.formatModelName(model.model)}
                subtitle={`${DataFormatter.formatTokens(model.totalTokens)} • ${DataFormatter.formatCost(model.cost)}`}
                icon={
                  (model.model || "").includes("opus")
                    ? Icon.Crown
                    : (model.model || "").includes("sonnet")
                      ? Icon.Star
                      : (model.model || "").includes("haiku")
                        ? Icon.Leaf
                        : Icon.Message
                }
              />
            ))
        ) : (
          <MenuBarExtra.Item title="No model data" icon={Icon.Circle} />
        )}
      </MenuBarExtra.Section>

      <MenuBarExtra.Section title="Actions">
        <MenuBarExtra.Item title="Open Claude Code" icon={Icon.Globe} onAction={() => open("https://claude.ai/code")} />
        <MenuBarExtra.Item
          title="Open Usage Monitor"
          icon={Icon.BarChart}
          onAction={() => open("raycast://extensions/nyatinte/ccusage/ccusage")}
        />
        <MenuBarExtra.Item
          title="ccusage Repository"
          icon={Icon.Code}
          onAction={() => open("https://github.com/ryoppippi/ccusage")}
        />
      </MenuBarExtra.Section>
    </MenuBarExtra>
  );
}
