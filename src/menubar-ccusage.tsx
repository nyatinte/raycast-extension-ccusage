import { MenuBarExtra, Icon, Color, open, openExtensionPreferences } from "@raycast/api";
import { 
  useccusageAvailability, 
  useDailyUsage, 
  useMonthlyUsage, 
  useTotalUsage 
} from "./hooks/use-usage-data";
import { formatCost, formatTokensAsMTok } from "./utils/data-formatter";

export default function MenuBarccusage() {
  // Check ccusage availability
  const { isAvailable, isLoading: availabilityLoading } = useccusageAvailability();
  
  // Get usage data (only when menu bar is displayed)
  const { data: dailyUsage, isLoading: dailyLoading } = useDailyUsage(0); // No refresh interval
  const { data: monthlyUsage, isLoading: monthlyLoading } = useMonthlyUsage();
  const { data: totalUsage, isLoading: totalLoading } = useTotalUsage(0); // No refresh interval

  const isLoading = availabilityLoading || dailyLoading || monthlyLoading || totalLoading;

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
    if (!dailyUsage) {
      return { source: Icon.Coins, tintColor: Color.SecondaryText };
    }

    // Use cost-based intensity
    const cost = dailyUsage.cost || 0;
    if (cost < 1) return { source: Icon.Coins, tintColor: Color.Green };
    if (cost < 5) return { source: Icon.Coins, tintColor: Color.Yellow };
    if (cost < 10) return { source: Icon.Coins, tintColor: Color.Orange };
    return { source: Icon.Coins, tintColor: Color.Red };
  };

  const getTooltip = () => {
    if (!dailyUsage) {
      return "No Claude usage today";
    }
    return `Today: ${formatCost(dailyUsage.cost)} • ${formatTokensAsMTok(dailyUsage.totalTokens)}`;
  };

  return (
    <MenuBarExtra icon={getMenuBarIcon()} tooltip={getTooltip()}>
      
      <MenuBarExtra.Section title="Today's Usage">
        <MenuBarExtra.Item
          title="Daily Cost"
          subtitle={
            dailyUsage 
              ? `${formatCost(dailyUsage.cost)} • ${formatTokensAsMTok(dailyUsage.totalTokens)}`
              : "No usage today"
          }
          icon={Icon.Calendar}
        />
      </MenuBarExtra.Section>

      <MenuBarExtra.Section title="Monthly Usage">
        <MenuBarExtra.Item
          title="Monthly Cost"
          subtitle={
            monthlyUsage 
              ? `${formatCost(monthlyUsage.cost)} • ${formatTokensAsMTok(monthlyUsage.totalTokens)}`
              : "No usage this month"
          }
          icon={Icon.BarChart}
        />
      </MenuBarExtra.Section>

      <MenuBarExtra.Section title="Total Usage">
        <MenuBarExtra.Item
          title="Total Cost"
          subtitle={
            totalUsage 
              ? `${formatCost(totalUsage.cost)} • ${formatTokensAsMTok(totalUsage.totalTokens)}`
              : "No usage data"
          }
          icon={Icon.Coins}
        />
      </MenuBarExtra.Section>

      <MenuBarExtra.Section title="Actions">
        <MenuBarExtra.Item 
          title="Open Claude Code" 
          icon={Icon.Globe} 
          onAction={() => open("https://claude.ai/code")} 
        />
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