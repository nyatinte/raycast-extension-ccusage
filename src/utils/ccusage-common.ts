import { cpus } from "os";

export const getEnhancedNodePaths = (): string => {
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
};

export const getCostBasedIcon = (cost: number) => {
  if (cost < 1) return { tintColor: "Green" as const };
  if (cost < 5) return { tintColor: "Yellow" as const };
  if (cost < 10) return { tintColor: "Orange" as const };
  return { tintColor: "Red" as const };
};

export const processUsageData = (data: unknown, type: "daily" | "monthly" | "total") => {
  const parsedData = data as Record<string, any>;

  switch (type) {
    case "daily":
      if (Array.isArray(parsedData.daily) && parsedData.daily.length > 0) {
        const today = new Date().toISOString().split("T")[0];
        const todayEntry = parsedData.daily.find((d: any) => d.date === today);
        if (todayEntry) {
          return {
            ...todayEntry,
            cost: todayEntry.totalCost || todayEntry.cost || 0,
          };
        }
        const latest = parsedData.daily[parsedData.daily.length - 1];
        return {
          ...latest,
          cost: latest.totalCost || latest.cost || 0,
        };
      }
      return null;

    case "monthly":
      if (Array.isArray(parsedData.monthly) && parsedData.monthly.length > 0) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const currentMonthEntry = parsedData.monthly.find((m: any) => m.month === currentMonth);
        if (currentMonthEntry) {
          return {
            ...currentMonthEntry,
            cost: currentMonthEntry.totalCost || 0,
          };
        }
        const latest = parsedData.monthly[parsedData.monthly.length - 1];
        return {
          ...latest,
          cost: latest.totalCost || 0,
        };
      }
      return null;

    case "total":
      if (parsedData.totals) {
        const totals = parsedData.totals as any;
        return {
          inputTokens: totals.inputTokens || 0,
          outputTokens: totals.outputTokens || 0,
          totalTokens: totals.totalTokens || 0,
          cost: totals.totalCost || 0,
        };
      }
      return null;

    default:
      return null;
  }
};
