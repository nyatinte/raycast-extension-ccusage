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
  console.log(`[DEBUG] CCUsage: Component rendering...`);
  
  const preferences = getPreferenceValues<Preferences>();
  const { isAvailable, isLoading: availabilityLoading } = useCCUsageAvailability();
  const stats = useUsageStats();

  console.log(`[DEBUG] CCUsage: Availability check:`, {
    isAvailable,
    availabilityLoading,
    statsLoading: stats.isLoading,
    statsError: stats.error,
    hasTodayUsage: !!stats.todayUsage,
    hasTotalUsage: !!stats.totalUsage
  });

  if (availabilityLoading) {
    console.log(`[DEBUG] CCUsage: Showing availability loading state`);
    return <List isLoading={true} />;
  }

  if (!isAvailable) {
    console.log(`[DEBUG] CCUsage: ccusage not available`);
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
