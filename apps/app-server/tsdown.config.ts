import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: false,
  clean: true,
  minify: true,
  target: "es2022",
  outDir: "./dist",
  treeshake: true,
  inlineOnly: false,
  noExternal: [/@qbs-autonaim\/.*/],
});
