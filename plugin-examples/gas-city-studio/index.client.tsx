import type { PluginClientContext } from "@getpaseo/plugin/client";
import { GasCityStudioPanel } from "./client/GasCityStudioPanel";

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

  // Add sidebar item for quick access
  plugin.addSidebarItem({
    id: "gas-city-studio",
    title: "Gas City",
    icon: "GitBranch",
    surface: "main",
  });

  return () => {};
}
