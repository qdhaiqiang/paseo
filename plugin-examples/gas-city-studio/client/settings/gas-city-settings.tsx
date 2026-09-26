import { useCallback, useMemo } from "react";
import { Text } from "react-native";
import { useSettings, type PluginSurfaceProps } from "@getpaseo/plugin/client";
import type { SettingsState } from "@getpaseo/plugin/client";
import {
  SettingsCard,
  SettingsInput,
  SettingsSection,
  SettingsSelect,
  SettingsSwitch,
} from "@getpaseo/plugin/client/ui";
import { gasCityPreferences } from "../../shared/preferences";

type Preferences = Extract<SettingsState<typeof gasCityPreferences.schema>, { status: "ready" }>;

const fontSizes = [
  { label: "Small", value: "small" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
] as const;

function GasCityControls({
  settings,
  theme,
}: {
  settings: Preferences;
  theme: PluginSurfaceProps["theme"];
}) {
  const style = useMemo(() => ({ color: theme.colors.foreground }), [theme]);

  const changeSupervisorUrl = useCallback(
    (supervisorUrl: string) => {
      void settings.save({ ...settings.values, supervisorUrl }, settings.revision);
    },
    [settings],
  );

  const changeCity = useCallback(
    (city: string) => {
      void settings.save({ ...settings.values, city }, settings.revision);
    },
    [settings],
  );

  const changeAutoConnect = useCallback(
    (autoConnect: boolean) => {
      void settings.save({ ...settings.values, autoConnect }, settings.revision);
    },
    [settings],
  );

  const changeShowAgentAvatars = useCallback(
    (showAgentAvatars: boolean) => {
      void settings.save({ ...settings.values, showAgentAvatars }, settings.revision);
    },
    [settings],
  );

  const changeTranscriptFontSize = useCallback(
    (transcriptFontSize: Preferences["values"]["transcriptFontSize"]) => {
      void settings.save({ ...settings.values, transcriptFontSize }, settings.revision);
    },
    [settings],
  );

  return (
    <SettingsSection title="Gas City Studio">
      <SettingsCard>
        <SettingsInput
          label="Supervisor URL"
          initialValue={settings.values.supervisorUrl}
          onChangeText={changeSupervisorUrl}
          disabled={settings.saving}
          error={settings.saveError}
          placeholder="http://localhost:8080"
        />
        <SettingsInput
          label="City name"
          initialValue={settings.values.city}
          onChangeText={changeCity}
          disabled={settings.saving}
          error={settings.saveError}
          placeholder="main"
        />
        <SettingsSwitch
          label="Auto-connect to last session"
          value={settings.values.autoConnect}
          disabled={settings.saving}
          onValueChange={changeAutoConnect}
        />
        <SettingsSwitch
          label="Show agent avatars"
          value={settings.values.showAgentAvatars}
          disabled={settings.saving}
          onValueChange={changeShowAgentAvatars}
        />
        <SettingsSelect
          label="Transcript font size"
          value={settings.values.transcriptFontSize}
          options={fontSizes}
          disabled={settings.saving}
          onValueChange={changeTranscriptFontSize}
        />
      </SettingsCard>

      {settings.saveError ? (
        <Text accessibilityRole="alert" style={style}>
          {settings.saveError}
        </Text>
      ) : null}

      <SettingsCard>
        <Text style={[style, { fontSize: 12, opacity: 0.7 }]}>
          These settings control how Gas City Studio connects to the Supervisor API and displays
          conversation transcripts.
        </Text>
      </SettingsCard>
    </SettingsSection>
  );
}

export function GasCitySettings({ theme }: PluginSurfaceProps) {
  const settings = useSettings(gasCityPreferences);
  const style = useMemo(() => ({ color: theme.colors.foreground }), [theme]);

  if (settings.status === "loading") return <Text style={style}>Loading settings…</Text>;
  if (settings.status !== "ready")
    return (
      <SettingsSection title="Gas City Studio">
        <Text style={style}>{settings.error}</Text>
        <SettingsCard>
          <Text style={[style, { fontSize: 12, opacity: 0.7 }]}>
            Failed to load settings. Try reloading or resetting to defaults.
          </Text>
        </SettingsCard>
      </SettingsSection>
    );

  return <GasCityControls settings={settings} theme={theme} />;
}
