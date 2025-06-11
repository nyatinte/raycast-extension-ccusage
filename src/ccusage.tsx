import { List, Icon, Action, ActionPanel, getPreferenceValues, openExtensionPreferences } from "@raycast/api";
import { useUsageStats, useccusageAvailability } from "./hooks/use-usage-data";
import DailyUsage from "./components/DailyUsage";
import SessionUsage from "./components/SessionUsage";
import CostAnalysis from "./components/CostAnalysis";
import ModelBreakdown from "./components/ModelBreakdown";

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
    return (
      <List>
        <List.Item
          title="ccusage not available"
          subtitle="ccusage CLI tool is required but not working with the configured runtime"
          icon={Icon.ExclamationMark}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser title="Install Ccusage" url="https://github.com/ryoppippi/ccusage" />
              <Action 
                title="Configure Runtime in Preferences" 
                icon={Icon.Gear} 
                onAction={openExtensionPreferences}
                shortcut={{ modifiers: ["cmd"], key: "," }}
              />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  const selectedItemId = preferences.defaultView || "daily";

  const settingsActions = (
    <>
      <Action
        title="Open Preferences"
        icon={Icon.Gear}
        shortcut={{ modifiers: ["cmd"], key: "," }}
        onAction={openExtensionPreferences}
      />
    </>
  );

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
