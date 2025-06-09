import { MenuBarExtra, Icon, Color, open } from "@raycast/api";
import { useUsageStats, useCCUsageAvailability } from "./hooks/use-usage-data";
import { DataFormatter } from "./utils/data-formatter";
import { UsageCalculator } from "./utils/usage-calculator";

export default function MenuBarCCUsage() {
  const { isAvailable, isLoading: availabilityLoading } = useCCUsageAvailability();
  const stats = useUsageStats(1000); // 1 second refresh for menu bar

  if (availabilityLoading || stats.isLoading) {
    return (
      <MenuBarExtra
        icon={{ source: Icon.Clock, tintColor: Color.SecondaryText }}
        tooltip="Loading Claude usage..."
        isLoading={true}
      />
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
            {stats.recentSessions.slice(0, 3).map((session) => (
              <MenuBarExtra.Item
                key={session.sessionId || session.model}
                title={DataFormatter.formatModelName(session.model)}
                subtitle={`${DataFormatter.formatTokens(session.totalTokens)} • ${DataFormatter.formatCost(session.cost)} • ${DataFormatter.formatRelativeTime(session.startTime)}`}
                icon={
                  session.model.includes("opus")
                    ? Icon.Crown
                    : session.model.includes("sonnet")
                      ? Icon.Sparkles
                      : session.model.includes("haiku")
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
            .map((model) => (
              <MenuBarExtra.Item
                key={model.model}
                title={DataFormatter.formatModelName(model.model)}
                subtitle={`${DataFormatter.formatTokens(model.totalTokens)} • ${DataFormatter.formatCost(model.cost)}`}
                icon={
                  model.model.includes("opus")
                    ? Icon.Crown
                    : model.model.includes("sonnet")
                      ? Icon.Sparkles
                      : model.model.includes("haiku")
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
          title="Ccusage Repository"
          icon={Icon.Code}
          onAction={() => open("https://github.com/ryoppippi/ccusage")}
        />
      </MenuBarExtra.Section>
    </MenuBarExtra>
  );
}
