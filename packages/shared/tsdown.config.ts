import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/server/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: false,
  clean: true,
  treeshake: true,
  outDir: "dist",
  external: ["@qbs-autonaim/ai", "@qbs-autonaim/db", "@qbs-autonaim/config"],
});
