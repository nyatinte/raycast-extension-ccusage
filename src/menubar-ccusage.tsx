import { MenuBarExtra, Icon, Color, open, openExtensionPreferences } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { useccusageAvailability } from "./hooks/use-usage-data";
import { formatCost, formatTokensAsMTok } from "./utils/data-formatter";
import { execSync } from "child_process";
import { cpus } from "os";

function getEnhancedNodePaths(): string {
  const isAppleSilicon = cpus()[0]?.model?.includes("Apple") ?? false;

  const platformPaths = isAppleSilicon
    ? ["/opt/homebrew/bin", "/opt/homebrew/lib/node_modules/.bin"]
    : ["/usr/local/bin", "/usr/local/lib/node_modules/.bin"];

  const versionManagerPaths = [
    `${process.env.HOME}/.nvm/versions/node/*/bin`,
    `${process.env.HOME}/.fnm/node-versions/*/installation/bin`,
    `${process.env.HOME}/.n/bin`,
    `${process.env.HOME}/.volta/bin`,
  ];

  const systemPaths = ["/usr/bin", "/bin", `${process.env.HOME}/.npm/bin`, `${process.env.HOME}/.yarn/bin`];

  const allPaths = [process.env.PATH || "", ...platformPaths, ...versionManagerPaths, ...systemPaths];

  return allPaths.filter((path) => path).join(":");
}

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

      // Parse results
      const dailyData = JSON.parse(dailyResult);
      const monthlyData = JSON.parse(monthlyResult);
      const totalData = JSON.parse(totalResult);

      // Process daily usage
      let dailyUsage = null;
      if (dailyData.daily && dailyData.daily.length > 0) {
        const today = new Date().toISOString().split("T")[0];
        const todayEntry = dailyData.daily.find((d: { date: string }) => d.date === today);
        if (todayEntry) {
          dailyUsage = {
            ...todayEntry,
            cost: todayEntry.totalCost || todayEntry.cost || 0,
          };
        } else {
          const latest = dailyData.daily[dailyData.daily.length - 1];
          dailyUsage = {
            ...latest,
            cost: latest.totalCost || latest.cost || 0,
          };
        }
      }

      // Process monthly usage
      let monthlyUsage = null;
      if (monthlyData.monthly && monthlyData.monthly.length > 0) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const currentMonthEntry = monthlyData.monthly.find((m: { month: string }) => m.month === currentMonth);
        if (currentMonthEntry) {
          monthlyUsage = {
            ...currentMonthEntry,
            cost: currentMonthEntry.totalCost || 0,
          };
        } else {
          const latest = monthlyData.monthly[monthlyData.monthly.length - 1];
          monthlyUsage = {
            ...latest,
            cost: latest.totalCost || 0,
          };
        }
      }

      // Process total usage
      let totalUsage = null;
      if (totalData.totals) {
        totalUsage = {
          inputTokens: totalData.totals.inputTokens || 0,
          outputTokens: totalData.totals.outputTokens || 0,
          totalTokens: totalData.totals.totalTokens || 0,
          cost: totalData.totals.totalCost || 0,
        };
      }

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

    // Use cost-based intensity
    const cost = usageData.dailyUsage.cost || 0;
    if (cost < 1) return { source: Icon.Coins, tintColor: Color.Green };
    if (cost < 5) return { source: Icon.Coins, tintColor: Color.Yellow };
    if (cost < 10) return { source: Icon.Coins, tintColor: Color.Orange };
    return { source: Icon.Coins, tintColor: Color.Red };
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
