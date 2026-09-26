import { defineSettings } from "@getpaseo/plugin";
import { z } from "zod";

export const gasCityPreferences = defineSettings({
  id: "gas-city-studio",
  scope: "host",
  version: 1,
  schema: z.object({
    supervisorUrl: z.string().url("Enter a valid URL").default("http://localhost:8080"),
    city: z.string().trim().min(1, "Enter a city name").max(50).default("main"),
    autoConnect: z.boolean().default(true),
    showAgentAvatars: z.boolean().default(true),
    transcriptFontSize: z.enum(["small", "medium", "large"]).default("medium"),
  }),
});
