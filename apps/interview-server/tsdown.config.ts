import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "./src/index.ts",
  format: "esm",
  outDir: "./dist",
  clean: true,
  sourcemap: true,
  inlineOnly: false,
  treeshake: true,
  minify: false,
  noExternal: [/@qbs-autonaim\/.*/],
  external: ["postcss", "postcss-*", "sanitize-html"],
});
