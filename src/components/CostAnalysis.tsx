import { List, Icon, ActionPanel, Action, Color } from "@raycast/api";
import { DailyUsageData, ModelUsage } from "../types/usage-types";
import { DataFormatter } from "../utils/data-formatter";
import { UsageCalculator } from "../utils/usage-calculator";

interface CostAnalysisProps {
  totalUsage: { inputTokens: number; outputTokens: number; totalTokens: number; cost: number } | null;
  dailyUsage: DailyUsageData | null;
  models: ModelUsage[];
  isLoading: boolean;
  error?: string;
}

export default function CostAnalysis({ totalUsage, dailyUsage, models, isLoading, error }: CostAnalysisProps) {
  const getCostIcon = (cost: number) => {
    if (cost === 0) return Icon.Circle;
    if (cost < 1) return Icon.Coins;
    if (cost < 10) return Icon.BankNote;
    if (cost < 50) return Icon.CreditCard;
    return Icon.Calculator;
  };

  const getCostColor = (cost: number) => {
    if (cost === 0) return Color.SecondaryText;
    if (cost < 1) return Color.Green;
    if (cost < 10) return Color.Yellow;
    if (cost < 50) return Color.Orange;
    return Color.Red;
  };

  const getAccessories = () => {
    if (error) {
      return [{ text: "Error", icon: { source: Icon.ExclamationMark, tintColor: Color.Red } }];
    }

    if (!totalUsage) {
      return [{ text: "No cost data", icon: Icon.Circle }];
    }

    return [
      { text: DataFormatter.formatCost(totalUsage.cost), icon: Icon.Coins },
      { text: `${models.length} models`, icon: Icon.BarChart },
    ];
  };

  const getDetailMetadata = () => {
    if (error) {
      return (
        <List.Item.Detail.Metadata>
          <List.Item.Detail.Metadata.Label title="Error" text={error} icon={Icon.ExclamationMark} />
        </List.Item.Detail.Metadata>
      );
    }

    if (!totalUsage) {
      return (
        <List.Item.Detail.Metadata>
          <List.Item.Detail.Metadata.Label title="Status" text="No cost data available" icon={Icon.Circle} />
          <List.Item.Detail.Metadata.Separator />
          <List.Item.Detail.Metadata.Label title="Note" text="Cost analysis will appear after using Claude Code" />
        </List.Item.Detail.Metadata>
      );
    }

    const costBreakdown = UsageCalculator.calculateCostBreakdown(models);
    const tokenBreakdown = UsageCalculator.calculateTokenBreakdown(models);

    // Calculate daily vs total comparison
    const dailyCostPercentage =
      dailyUsage && totalUsage.cost > 0 ? DataFormatter.formatPercentage(dailyUsage.cost, totalUsage.cost) : "0%";

    // Estimate monthly cost based on daily average
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const todayDayOfMonth = new Date().getDate();
    const dailyAverage = totalUsage.cost / Math.max(todayDayOfMonth, 1);
    const projectedMonthlyCost = dailyAverage * daysInMonth;

    return (
      <List.Item.Detail.Metadata>
        <List.Item.Detail.Metadata.Label
          title="Cost Overview"
          text={DataFormatter.formatCost(totalUsage.cost)}
          icon={Icon.Coins}
        />
        <List.Item.Detail.Metadata.Separator />

        <List.Item.Detail.Metadata.Label title="Daily vs Total" />
        <List.Item.Detail.Metadata.Label
          title="Today's Cost"
          text={dailyUsage ? DataFormatter.formatCost(dailyUsage.cost) : "$0.00"}
        />
        <List.Item.Detail.Metadata.Label title="Today's % of Total" text={dailyCostPercentage} />
        <List.Item.Detail.Metadata.Label title="Total Cost" text={DataFormatter.formatCost(totalUsage.cost)} />
        <List.Item.Detail.Metadata.Separator />

        <List.Item.Detail.Metadata.Label title="Cost Efficiency" />
        <List.Item.Detail.Metadata.Label
          title="Cost per Token"
          text={DataFormatter.getCostPerToken(totalUsage.cost, totalUsage.totalTokens)}
        />
        <List.Item.Detail.Metadata.Label
          title="Cost per Input Token"
          text={DataFormatter.getCostPerToken(totalUsage.cost, totalUsage.inputTokens)}
        />
        <List.Item.Detail.Metadata.Label
          title="Cost per Output Token"
          text={DataFormatter.getCostPerToken(totalUsage.cost, totalUsage.outputTokens)}
        />
        <List.Item.Detail.Metadata.Separator />

        <List.Item.Detail.Metadata.Label title="Projections" />
        <List.Item.Detail.Metadata.Label title="Daily Average" text={DataFormatter.formatCost(dailyAverage)} />
        <List.Item.Detail.Metadata.Label
          title="Projected Monthly"
          text={DataFormatter.formatCost(projectedMonthlyCost)}
          icon={projectedMonthlyCost > 100 ? { source: Icon.ExclamationMark, tintColor: Color.Red } : undefined}
        />
        <List.Item.Detail.Metadata.Separator />

        <List.Item.Detail.Metadata.Label title="Cost by Model" />
        {costBreakdown.breakdown.slice(0, 5).map((model) => (
          <List.Item.Detail.Metadata.Label
            key={model.model}
            title={DataFormatter.formatModelName(model.model)}
            text={`${DataFormatter.formatCost(model.cost)} (${model.percentage})`}
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
        ))}

        {tokenBreakdown.breakdown.length > 0 && (
          <>
            <List.Item.Detail.Metadata.Separator />
            <List.Item.Detail.Metadata.Label title="Token Distribution" />
            {tokenBreakdown.breakdown.slice(0, 3).map((model) => (
              <List.Item.Detail.Metadata.Label
                key={`token-${model.model}`}
                title={DataFormatter.formatModelName(model.model)}
                text={`${DataFormatter.formatTokens(model.tokens)} (${model.percentage})`}
                icon={Icon.Text}
              />
            ))}
          </>
        )}
      </List.Item.Detail.Metadata>
    );
  };

  const mainCost = totalUsage?.cost || 0;

  return (
    <List.Item
      id="cost-analysis"
      title="Cost Analysis"
      subtitle={totalUsage ? `Total: ${DataFormatter.formatCost(totalUsage.cost)}` : "No cost data"}
      icon={{ source: getCostIcon(mainCost), tintColor: getCostColor(mainCost) }}
      accessories={getAccessories()}
      detail={<List.Item.Detail isLoading={isLoading} metadata={getDetailMetadata()} />}
      actions={
        <ActionPanel>
          <Action.OpenInBrowser title="Claude Pricing" url="https://www.anthropic.com/pricing" icon={Icon.Coins} />
          <Action.OpenInBrowser
            title="Usage Guidelines"
            url="https://docs.anthropic.com/claude/docs/usage-guidelines"
            icon={Icon.Book}
          />
          <Action.OpenInBrowser title="Open Claude Code" url="https://claude.ai/code" icon={Icon.Globe} />
        </ActionPanel>
      }
    />
  );
}
