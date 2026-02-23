import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "./src/index.ts",
  format: "esm",
  outDir: "./dist",
  clean: true,
  sourcemap: false,
  inlineOnly: true,
  treeshake: true,
  minify: true,
  noExternal: [/@qbs-autonaim\/.*/],
});
