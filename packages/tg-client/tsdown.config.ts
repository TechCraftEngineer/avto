import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "sdk/client": "src/sdk/client.ts",
  },
  format: ["esm"],
  clean: true,
  outDir: "dist",
  sourcemap: false,
  minify: false,
  treeshake: true,
  external: [
    "@mtcute/bun",
    "@mtcute/core",
    "@mtcute/dispatcher",
    "@fuman/utils",
    "@fuman/io",
    "@qbs-autonaim/config",
    "@qbs-autonaim/db",
    "@qbs-autonaim/lib",
    "@qbs-autonaim/ai",
    "hono",
    "long",
    "zod",
  ],
});
