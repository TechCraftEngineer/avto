import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: false,
  clean: true,
  minify: true,
  target: "es2022",
  inlineOnly: false,
  treeshake: true,
  outDir: "dist",
  external: ["xhr-sync-worker.js", "canvas", "utf-8-validate"],
  noExternal: ["@qbs-autonaim/*"],
});
