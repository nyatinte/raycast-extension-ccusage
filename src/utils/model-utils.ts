import { Icon, Color } from "@raycast/api";

export const getModelIcon = (model: string): Icon => {
  const modelName = model.toLowerCase();
  if (modelName.includes("opus")) return Icon.Crown;
  if (modelName.includes("sonnet")) return Icon.Star;
  if (modelName.includes("haiku")) return Icon.Leaf;
  return Icon.Message;
};

export const getModelIconColor = (model: string): Color => {
  const modelName = model.toLowerCase();
  if (modelName.includes("opus")) return Color.Purple;
  if (modelName.includes("sonnet")) return Color.Blue;
  if (modelName.includes("haiku")) return Color.Green;
  return Color.SecondaryText;
};

export const getModelTier = (model: string): "Premium" | "Standard" | "Fast" | "Unknown" => {
  const modelName = model.toLowerCase();
  if (modelName.includes("opus")) return "Premium";
  if (modelName.includes("sonnet")) return "Standard";
  if (modelName.includes("haiku")) return "Fast";
  return "Unknown";
};

export const groupModelsByTier = <T extends { model: string }>(models: T[]) => {
  return models.reduce(
    (acc, model) => {
      const tier = getModelTier(model.model || "");
      if (!acc[tier]) acc[tier] = [];
      acc[tier].push(model);
      return acc;
    },
    {} as Record<string, T[]>,
  );
};
