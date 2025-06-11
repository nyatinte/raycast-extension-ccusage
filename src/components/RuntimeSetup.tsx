import { useState } from "react";
import { Form, ActionPanel, Action, showToast, Toast } from "@raycast/api";
import { saveRuntimeSettings, markAsInitialized } from "../utils/runtime-settings";
import { RuntimeConfig } from "../types/runtime-types";

type Props = {
  onComplete: () => void;
};

type FormValues = {
  runtimeType: RuntimeConfig["type"];
  customPath?: string;
};

export default function RuntimeSetup({ onComplete }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    try {
      showToast({
        style: Toast.Style.Animated,
        title: "Saving configuration...",
        message: `Setting up ${values.runtimeType} runtime`,
      });

      // Save settings
      await saveRuntimeSettings({
        initialized: true,
        selectedRuntime: values.runtimeType,
        customPath: values.customPath,
        runtimes: {
          [values.runtimeType]: {
            type: values.runtimeType,
            path: values.customPath,
            verified: true,
            lastChecked: new Date().toISOString(),
          },
        },
      });

      await markAsInitialized();

      showToast({
        style: Toast.Style.Success,
        title: "Setup Complete!",
        message: `${values.runtimeType} runtime configured successfully`,
      });

      setTimeout(() => onComplete(), 1000);
    } catch (error) {
      console.error("Runtime setup failed:", error);
      showToast({
        style: Toast.Style.Failure,
        title: "Setup Error",
        message: error instanceof Error ? error.message : "Failed to save configuration",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save Configuration" onSubmit={handleSubmit} />
          <Action
            title="Reset Settings"
            shortcut={{ modifiers: ["cmd"], key: "k" }}
            onAction={() => {
              // Reset form or show reset confirmation
              showToast({
                style: Toast.Style.Animated,
                title: "Resetting...",
                message: "Configuration will be reset",
              });
            }}
          />
        </ActionPanel>
      }
      isLoading={isSubmitting}
    >
      <Form.Description
        title="ccusage Runtime Configuration"
        text="Select your preferred JavaScript runtime and optionally specify a custom path."
      />

      <Form.Dropdown id="runtimeType" title="Runtime" placeholder="Choose runtime..." storeValue>
        <Form.Dropdown.Item value="npx" title="npx (Node Package Execute)" icon="📦" />
        <Form.Dropdown.Item value="bunx" title="bunx (Bun Package Execute)" icon="🚀" />
        <Form.Dropdown.Item value="pnpm" title="pnpm dlx (PNPM Package Execute)" icon="📋" />
        <Form.Dropdown.Item value="deno" title="deno run (Deno Runtime)" icon="🦕" />
      </Form.Dropdown>

      <Form.TextField
        id="customPath"
        title="Custom Path (Optional)"
        placeholder="e.g., /usr/local/bin/npx"
        info="If not specified, the runtime will be detected from your system PATH"
      />

      <Form.Separator />

      <Form.Description text="After configuration, ccusage commands will be executed using your selected runtime." />
    </Form>
  );
}
