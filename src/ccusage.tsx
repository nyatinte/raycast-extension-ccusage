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
          title="ccusageが利用できません"
          subtitle="PreferencesでJavaScriptランタイム（npx, pnpm, etc...）を選択し、パスを設定してください"
          icon={Icon.ExclamationMark}
          actions={
            <ActionPanel>
              <Action
                title="Preferencesで設定する"
                icon={Icon.Gear}
                onAction={openExtensionPreferences}
                shortcut={{ modifiers: ["cmd", "shift"], key: "," }}
              />
              <Action.OpenInBrowser title="Ccusageについて詳しく" url="https://github.com/ryoppippi/ccusage" />
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
        shortcut={{ modifiers: ["cmd", "shift"], key: "," }}
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
