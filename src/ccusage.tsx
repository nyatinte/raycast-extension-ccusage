import { List, Icon, Action, ActionPanel, getPreferenceValues } from "@raycast/api";
import { useEffect, useState } from "react";
import { useUsageStats, useccusageAvailability } from "./hooks/use-usage-data";
import { isInitialized, hasValidRuntimeConfig, resetRuntimeSettings } from "./utils/runtime-settings";
import RuntimeSetup from "./components/RuntimeSetup";
import DailyUsage from "./components/DailyUsage";
import SessionUsage from "./components/SessionUsage";
import CostAnalysis from "./components/CostAnalysis";
import ModelBreakdown from "./components/ModelBreakdown";

type Preferences = {
  defaultView: string;
};

export default function ccusage() {
  const preferences = getPreferenceValues<Preferences>();
  const [initialized, setInitialized] = useState(false);
  const [hasValidConfig, setHasValidConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // All hooks must be called at the top level
  const { isAvailable, isLoading: availabilityLoading } = useccusageAvailability();
  const stats = useUsageStats();

  const checkInitialization = async () => {
    setIsLoading(true);
    try {
      const [initResult, configResult] = await Promise.all([isInitialized(), hasValidRuntimeConfig()]);
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

  useEffect(() => {
    checkInitialization();
  }, []);

  // Show setup first if not initialized
  if (isLoading) {
    return <List isLoading={true} />;
  }

  // Runtime configuration is mandatory - show setup if not configured
  if (!initialized || !hasValidConfig || showSettings) {
    return (
      <RuntimeSetup
        onComplete={() => {
          setShowSettings(false);
          checkInitialization();
        }}
      />
    );
  }

  // After runtime is configured, check ccusage availability
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
              <Action title="Reconfigure Runtime" icon={Icon.Gear} onAction={() => setShowSettings(true)} />
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
        title="Runtime Settings"
        icon={Icon.Gear}
        shortcut={{ modifiers: ["cmd"], key: "k" }}
        onAction={() => setShowSettings(true)}
      />
      <Action
        title="Reset Settings"
        icon={Icon.Trash}
        shortcut={{ modifiers: ["cmd", "shift"], key: "delete" }}
        onAction={async () => {
          await resetRuntimeSettings();
          setShowSettings(true);
        }}
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
