import type { PluginClientContext } from "@getpaseo/plugin/client";
import { GasCityStudioPanel } from "./client/GasCityStudioPanel";
import { GasCitySettings } from "./client/settings/gas-city-settings";

export default function contribute(plugin: PluginClientContext) {
  // Register as workspace panel
  plugin.addWorkspacePanel({
    id: "gas-city-studio",
    title: "Gas City Studio",
    icon: "GitBranch",
    context: "workspace",
    locations: ["workspace", "explorer"],
    Component: GasCityStudioPanel,
  });

  // Register settings screen
  plugin.addSettingsScreen({
    id: "gas-city-studio",
    title: "Gas City Studio",
    icon: "GitBranch",
    Component: GasCitySettings,
  });

  // Add command center item
  plugin.addCommandCenterItem({
    id: "gas-city-studio-settings",
    title: "Configure Gas City Studio",
    icon: "Settings",
    context: "global",
    onSelect({ openSettings }) {
      openSettings("gas-city-studio");
    },
  });

  // Add sidebar item for quick access
  plugin.addSidebarItem({
    id: "gas-city-studio",
    title: "Gas City",
    icon: "GitBranch",
    surface: "main",
  });

  return () => {};
}
