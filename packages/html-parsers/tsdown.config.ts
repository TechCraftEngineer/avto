import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  clean: true,
  dts: true,
  external: [
    "@qbs-autonaim/ai",
    "@qbs-autonaim/lib",
    "cheerio",
    "sanitize-html",
    "zod",
  ],
});
