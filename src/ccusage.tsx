import { List, getPreferenceValues } from "@raycast/api";
import { useUsageStats, useccusageAvailability } from "./hooks/use-usage-data";
import DailyUsage from "./components/DailyUsage";
import SessionUsage from "./components/SessionUsage";
import CostAnalysis from "./components/CostAnalysis";
import ModelBreakdown from "./components/ModelBreakdown";
import ErrorState from "./components/ErrorState";

type Preferences = {
  defaultView: string;
};

export default function ccusage() {
  const preferences = getPreferenceValues<Preferences>();

  // All hooks must be called at the top level
  const { isAvailable, isLoading: availabilityLoading } = useccusageAvailability();
  const stats = useUsageStats();

  // Check ccusage availability
  if (availabilityLoading) {
    return <List isLoading={true} />;
  }

  if (!isAvailable) {
    return <ErrorState />;
  }

  const selectedItemId = preferences.defaultView || "daily";

  const settingsActions = null;

  return (
    <List isLoading={stats.isLoading} selectedItemId={selectedItemId} isShowingDetail>
      <DailyUsage
        dailyUsage={stats.todayUsage}
        isLoading={stats.isLoading}
        error={stats.error}
        settingsActions={settingsActions}
      />
      <SessionUsage
        sessions={stats.recentSessions}
        isLoading={stats.isLoading}
        error={stats.error}
        settingsActions={settingsActions}
      />
      <CostAnalysis
        totalUsage={stats.totalUsage}
        dailyUsage={stats.todayUsage}
        models={stats.topModels}
        isLoading={stats.isLoading}
        error={stats.error}
        settingsActions={settingsActions}
      />
      <ModelBreakdown
        models={stats.topModels}
        isLoading={stats.isLoading}
        error={stats.error}
        settingsActions={settingsActions}
      />
    </List>
  );
}
