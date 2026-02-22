import { presetInterviewDomains } from "@qbs-autonaim/db/schema";
import { publicProcedure } from "../../orpc";

export const listPresets = publicProcedure.query(async () => {
  return presetInterviewDomains.map((preset) => ({
    id: preset.id,
    domain: preset.domain,
    label: preset.label,
    isPreset: true,
    isVerified: true,
  }));
});
