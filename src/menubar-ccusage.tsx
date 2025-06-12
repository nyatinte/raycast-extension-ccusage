import { MenuBarExtra, Icon, Color, open, openExtensionPreferences } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { useccusageAvailability } from "./hooks/use-usage-data";
import { formatCost, formatTokensAsMTok } from "./utils/data-formatter";
import { getEnhancedNodePaths, getCostBasedIcon, processUsageData } from "./utils/ccusage-common";
import { execSync } from "child_process";

export default function MenuBarccusage() {
  // Check ccusage availability
  const { isAvailable, isLoading: availabilityLoading } = useccusageAvailability();

  // Get usage data with usePromise (system-monitor style)
  const { data: usageData, isLoading: usageLoading } = usePromise(async () => {
    if (!isAvailable) return null;

    try {
      const enhancedPath = getEnhancedNodePaths();

      // Get daily, monthly, and total usage
      const [dailyResult, monthlyResult, totalResult] = await Promise.all([
        new Promise<string>((resolve, reject) => {
          try {
            const result = execSync("npx ccusage@latest daily --json", {
              env: { ...process.env, PATH: enhancedPath },
              encoding: "utf8",
              timeout: 30000,
            });
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }),
        new Promise<string>((resolve, reject) => {
          try {
            const result = execSync("npx ccusage@latest monthly --json", {
              env: { ...process.env, PATH: enhancedPath },
              encoding: "utf8",
              timeout: 30000,
            });
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }),
        new Promise<string>((resolve, reject) => {
          try {
            const result = execSync("npx ccusage@latest --json", {
              env: { ...process.env, PATH: enhancedPath },
              encoding: "utf8",
              timeout: 30000,
            });
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }),
      ]);

      // Parse and process results using common utility functions
      const dailyData = JSON.parse(dailyResult);
      const monthlyData = JSON.parse(monthlyResult);
      const totalData = JSON.parse(totalResult);

      const dailyUsage = processUsageData(dailyData, "daily");
      const monthlyUsage = processUsageData(monthlyData, "monthly");
      const totalUsage = processUsageData(totalData, "total");

      return { dailyUsage, monthlyUsage, totalUsage };
    } catch (error) {
      console.error("Failed to fetch usage data:", error);
      return null;
    }
  });

  const isLoading = availabilityLoading || usageLoading;

  if (isLoading) {
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
        <MenuBarExtra.Item
          title="Configure Runtime"
          subtitle="Open extension preferences"
          icon={Icon.Gear}
          onAction={openExtensionPreferences}
        />
      </MenuBarExtra>
    );
  }

  // Calculate menu bar icon based on daily usage
  const getMenuBarIcon = () => {
    if (!usageData?.dailyUsage) {
      return { source: Icon.Coins, tintColor: Color.SecondaryText };
    }

    const cost = usageData.dailyUsage.cost || 0;
    const colorConfig = getCostBasedIcon(cost);
    return { source: Icon.Coins, tintColor: Color[colorConfig.tintColor] };
  };

  const getTooltip = () => {
    if (!usageData?.dailyUsage) {
      return "No Claude usage today";
    }
    return `Today: ${formatCost(usageData.dailyUsage.cost)} • ${formatTokensAsMTok(usageData.dailyUsage.totalTokens)}`;
  };

  return (
    <MenuBarExtra icon={getMenuBarIcon()} tooltip={getTooltip()}>
      <MenuBarExtra.Section title="Today's Usage">
        <MenuBarExtra.Item
          title={
            usageData?.dailyUsage
              ? `${formatCost(usageData.dailyUsage.cost)} • ${formatTokensAsMTok(usageData.dailyUsage.totalTokens)}`
              : "No usage today"
          }
          icon={Icon.Calendar}
          onAction={() => open("raycast://extensions/nyatinte/ccusage/ccusage")}
        />
      </MenuBarExtra.Section>

      <MenuBarExtra.Section title="Monthly Usage">
        <MenuBarExtra.Item
          title={
            usageData?.monthlyUsage
              ? `${formatCost(usageData.monthlyUsage.cost)} • ${formatTokensAsMTok(usageData.monthlyUsage.totalTokens)}`
              : "No usage this month"
          }
          icon={Icon.BarChart}
          onAction={() => open("raycast://extensions/nyatinte/ccusage/ccusage")}
        />
      </MenuBarExtra.Section>

      <MenuBarExtra.Section title="Total Usage">
        <MenuBarExtra.Item
          title={
            usageData?.totalUsage
              ? `${formatCost(usageData.totalUsage.cost)} • ${formatTokensAsMTok(usageData.totalUsage.totalTokens)}`
              : "No usage data"
          }
          icon={Icon.Coins}
          onAction={() => open("raycast://extensions/nyatinte/ccusage/ccusage")}
        />
      </MenuBarExtra.Section>
    </MenuBarExtra>
  );
}
