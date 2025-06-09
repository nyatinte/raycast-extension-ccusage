import { List, Icon, ActionPanel, Action, Color } from "@raycast/api";
import { ModelUsage } from "../types/usage-types";
import { DataFormatter } from "../utils/data-formatter";
import { UsageCalculator } from "../utils/usage-calculator";

interface ModelBreakdownProps {
  models: ModelUsage[];
  isLoading: boolean;
  error?: string;
}

export default function ModelBreakdown({ models, isLoading, error }: ModelBreakdownProps) {
  const getModelIcon = (model: string) => {
    if (model.includes("opus")) return Icon.Crown;
    if (model.includes("sonnet")) return Icon.Sparkles;
    if (model.includes("haiku")) return Icon.Leaf;
    return Icon.Message;
  };

  const getModelIconColor = (model: string) => {
    if (model.includes("opus")) return Color.Purple;
    if (model.includes("sonnet")) return Color.Blue;
    if (model.includes("haiku")) return Color.Green;
    return Color.SecondaryText;
  };

  const getModelTier = (model: string): "Premium" | "Standard" | "Fast" | "Unknown" => {
    if (model.includes("opus")) return "Premium";
    if (model.includes("sonnet")) return "Standard";
    if (model.includes("haiku")) return "Fast";
    return "Unknown";
  };

  const getAccessories = () => {
    if (error) {
      return [{ text: "Error", icon: { source: Icon.ExclamationMark, tintColor: Color.Red } }];
    }

    if (!models || models.length === 0) {
      return [{ text: "No models", icon: Icon.Circle }];
    }

    const totalCost = models.reduce((sum, model) => sum + model.cost, 0);
    const totalSessions = models.reduce((sum, model) => sum + model.sessionCount, 0);

    return [
      { text: `${models.length} models`, icon: Icon.BarChart },
      { text: `${totalSessions} sessions`, icon: Icon.List },
      { text: DataFormatter.formatCost(totalCost), icon: Icon.Coins },
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

    if (!models || models.length === 0) {
      return (
        <List.Item.Detail.Metadata>
          <List.Item.Detail.Metadata.Label title="Status" text="No model usage data available" icon={Icon.Circle} />
          <List.Item.Detail.Metadata.Separator />
          <List.Item.Detail.Metadata.Label
            title="Note"
            text="Model breakdown will appear after using different Claude models"
          />
        </List.Item.Detail.Metadata>
      );
    }

    const topModels = UsageCalculator.getTopModels(models, 10);
    const tokenBreakdown = UsageCalculator.calculateTokenBreakdown(models);
    const costBreakdown = UsageCalculator.calculateCostBreakdown(models);
    const efficiency = UsageCalculator.calculateEfficiencyMetrics(
      models.flatMap((model) =>
        Array(model.sessionCount).fill({
          sessionId: `${model.model}-session`,
          startTime: new Date().toISOString(),
          inputTokens: Math.floor(model.inputTokens / model.sessionCount),
          outputTokens: Math.floor(model.outputTokens / model.sessionCount),
          totalTokens: Math.floor(model.totalTokens / model.sessionCount),
          cost: model.cost / model.sessionCount,
          model: model.model,
        }),
      ),
    );

    // Group models by tier
    const modelsByTier = models.reduce(
      (acc, model) => {
        const tier = getModelTier(model.model);
        if (!acc[tier]) acc[tier] = [];
        acc[tier].push(model);
        return acc;
      },
      {} as Record<string, ModelUsage[]>,
    );

    return (
      <List.Item.Detail.Metadata>
        <List.Item.Detail.Metadata.Label
          title="Model Overview"
          text={`${models.length} models used`}
          icon={Icon.BarChart}
        />
        <List.Item.Detail.Metadata.Separator />

        <List.Item.Detail.Metadata.Label title="Usage Distribution" />
        <List.Item.Detail.Metadata.Label
          title="Total Tokens"
          text={DataFormatter.formatTokens(tokenBreakdown.totalTokens)}
        />
        <List.Item.Detail.Metadata.Label title="Total Cost" text={DataFormatter.formatCost(costBreakdown.totalCost)} />
        <List.Item.Detail.Metadata.Label
          title="Total Sessions"
          text={models.reduce((sum, m) => sum + m.sessionCount, 0).toString()}
        />
        <List.Item.Detail.Metadata.Separator />

        {efficiency.mostEfficientModel && (
          <>
            <List.Item.Detail.Metadata.Label title="Efficiency Analysis" />
            <List.Item.Detail.Metadata.Label
              title="Most Efficient Model"
              text={DataFormatter.formatModelName(efficiency.mostEfficientModel)}
              icon={{
                source: getModelIcon(efficiency.mostEfficientModel),
                tintColor: getModelIconColor(efficiency.mostEfficientModel),
              }}
            />
            <List.Item.Detail.Metadata.Label
              title="Average Cost per Output"
              text={`$${efficiency.averageCostPerOutput.toFixed(6)}`}
            />
            <List.Item.Detail.Metadata.Separator />
          </>
        )}

        {Object.entries(modelsByTier).map(
          ([tier, tierModels]) =>
            tierModels.length > 0 && (
              <div key={tier}>
                <List.Item.Detail.Metadata.Label title={`${tier} Models`} />
                {tierModels.slice(0, 3).map((model) => {
                  const percentage =
                    tokenBreakdown.totalTokens > 0
                      ? DataFormatter.formatPercentage(model.totalTokens, tokenBreakdown.totalTokens)
                      : "0%";

                  return (
                    <List.Item.Detail.Metadata.Label
                      key={model.model}
                      title={DataFormatter.formatModelName(model.model)}
                      text={`${DataFormatter.formatTokens(model.totalTokens)} (${percentage}) • ${DataFormatter.formatCost(model.cost)} • ${model.sessionCount} sessions`}
                      icon={{ source: getModelIcon(model.model), tintColor: getModelIconColor(model.model) }}
                    />
                  );
                })}
                <List.Item.Detail.Metadata.Separator />
              </div>
            ),
        )}

        <List.Item.Detail.Metadata.Label title="Top Models by Usage" />
        {topModels.slice(0, 5).map((model, index) => {
          const costPerToken = model.totalTokens > 0 ? model.cost / model.totalTokens : 0;

          return (
            <List.Item.Detail.Metadata.Label
              key={`top-${model.model}`}
              title={`${index + 1}. ${DataFormatter.formatModelName(model.model)}`}
              text={`${DataFormatter.formatTokens(model.totalTokens)} • ${DataFormatter.formatCost(model.cost)} • $${costPerToken.toFixed(6)}/token`}
              icon={{ source: getModelIcon(model.model), tintColor: getModelIconColor(model.model) }}
            />
          );
        })}
      </List.Item.Detail.Metadata>
    );
  };

  return (
    <List.Item
      id="model-breakdown"
      title="Model Breakdown"
      subtitle={models && models.length > 0 ? `${models.length} models used` : "No model data"}
      icon={Icon.BarChart}
      accessories={getAccessories()}
      detail={<List.Item.Detail isLoading={isLoading} metadata={getDetailMetadata()} />}
      actions={
        <ActionPanel>
          <Action.OpenInBrowser
            title="Claude Model Comparison"
            url="https://docs.anthropic.com/claude/docs/models-overview"
            icon={Icon.Book}
          />
          <Action.OpenInBrowser title="Claude Pricing" url="https://www.anthropic.com/pricing" icon={Icon.Coins} />
          <Action.OpenInBrowser title="Open Claude Code" url="https://claude.ai/code" icon={Icon.Globe} />
        </ActionPanel>
      }
    />
  );
}
