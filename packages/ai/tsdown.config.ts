import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: false,
  clean: true,
  external: [
    "@qbs-autonaim/config",
    "@qbs-autonaim/lib",
    "ai",
    "langfuse",
    "p-limit",
    "string-strip-html",
    "uuid",
    "zod"
  ],
  inlineOnly: false,
  treeshake: true,
  outDir: "dist",
});
