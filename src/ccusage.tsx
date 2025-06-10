import { List, Icon, Action, ActionPanel, getPreferenceValues } from "@raycast/api";
import { useUsageStats, useCCUsageAvailability } from "./hooks/use-usage-data";
import DailyUsage from "./components/DailyUsage";
import SessionUsage from "./components/SessionUsage";
import CostAnalysis from "./components/CostAnalysis";
import ModelBreakdown from "./components/ModelBreakdown";

interface Preferences {
  defaultView: string;
}

export default function CCUsage() {
  const preferences = getPreferenceValues<Preferences>();
  const { isAvailable, isLoading: availabilityLoading } = useCCUsageAvailability();
  const stats = useUsageStats();

  if (availabilityLoading) {
    return <List isLoading={true} />;
  }

  if (!isAvailable) {
    return (
      <List>
        <List.Item
          title="ccusage not available"
          subtitle="Please install ccusage to monitor Claude Code usage"
          icon={Icon.ExclamationMark}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser title="Install Ccusage" url="https://github.com/ryoppippi/ccusage" />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  const selectedItemId = preferences.defaultView || "daily";

  return (
    <List isLoading={stats.isLoading} selectedItemId={selectedItemId} isShowingDetail>
      <DailyUsage dailyUsage={stats.todayUsage} isLoading={stats.isLoading} error={stats.error} />
      <SessionUsage sessions={stats.recentSessions} isLoading={stats.isLoading} error={stats.error} />
      <CostAnalysis
        totalUsage={stats.totalUsage}
        dailyUsage={stats.todayUsage}
        models={stats.topModels}
        isLoading={stats.isLoading}
        error={stats.error}
      />
      <ModelBreakdown models={stats.topModels} isLoading={stats.isLoading} error={stats.error} />
    </List>
  );
}
