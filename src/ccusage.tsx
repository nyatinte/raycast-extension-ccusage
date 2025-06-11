import { List, Detail, Action, ActionPanel } from "@raycast/api";
import { useExec } from "@raycast/utils";
import { cpus } from "os";

type CommandTest = {
  id: string;
  title: string;
  command: string;
  args: string[];
  options?: { env?: NodeJS.ProcessEnv };
  description: string;
};

// Common node modules installation paths
const getNodePaths = () => {
  const isAppleSilicon = cpus()[0].model.includes("Apple");
  const homeDir = process.env.HOME || "/Users/unknown";

  return [
    // Homebrew paths
    isAppleSilicon ? "/opt/homebrew/bin" : "/usr/local/bin",
    isAppleSilicon ? "/opt/homebrew/lib/node_modules/.bin" : "/usr/local/lib/node_modules/.bin",

    // Node Version Manager paths
    `${homeDir}/.nvm/versions/node/current/bin`,

    // Global npm paths
    `${homeDir}/.npm-global/bin`,
    `${homeDir}/.local/bin`,

    // Volta paths
    `${homeDir}/.volta/bin`,

    // Yarn global paths
    `${homeDir}/.yarn/bin`,

    // System paths
    "/usr/bin",
    "/bin",
    "/usr/sbin",
    "/sbin",
  ] as const satisfies readonly string[];
};

// Create enhanced PATH commands
const createEnhancedCommands = (): CommandTest[] => {
  const NODE_PATHS = getNodePaths();
  const PATH = NODE_PATHS.join(":");
  const enhancedEnv = {
    ...process.env,
    PATH,
  };

  return [
    {
      id: "ccusage-enhanced-json",
      title: "CCUsage JSON",
      command: "npx",
      args: ["ccusage@latest", "--json"],
      options: { env: enhancedEnv },
      description: "CCUsage with enhanced PATH",
    },
    {
      id: "ccusage-enhanced-daily",
      title: "CCUsage Daily",
      command: "npx",
      args: ["ccusage@latest", "daily", "--json"],
      options: { env: enhancedEnv },
      description: "CCUsage daily stats with enhanced PATH",
    },
  ];
};

// Command execution component
function CommandTest({ command }: { command: CommandTest }) {
  const { data, isLoading, error } = useExec(command.command, command.args, command.options || {});
  const commandString = `${command.command} ${command.args.join(" ")}`;

  if (isLoading) {
    return <Detail isLoading={true} markdown={`# Command: \`${commandString}\`\n\nExecuting...`} />;
  }

  if (error) {
    const errorMarkdown = `# Command: \`${commandString}\`

## Status: ❌ Error

## Description:
${command.description}

## Error Details:
\`\`\`
${error.message}
\`\`\`
`;
    return <Detail markdown={errorMarkdown} />;
  }

  const successMarkdown = `# Command: \`${commandString}\`

## Status: ✅ Success

## Description:
${command.description}

## Output:
\`\`\`
${data || "(no output)"}
\`\`\`
`;

  return <Detail markdown={successMarkdown} />;
}

export default function CCUsage() {
  const enhancedCommands = createEnhancedCommands();

  return (
    <List>
      {enhancedCommands.map((command) => (
        <List.Item
          key={command.id}
          title={command.title}
          subtitle={command.description}
          accessories={[{ text: `${command.command} ${command.args.join(" ")}` }]}
          actions={
            <ActionPanel>
              <Action.Push title="Run Test" target={<CommandTest command={command} />} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
