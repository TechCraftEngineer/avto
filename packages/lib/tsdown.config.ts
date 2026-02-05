import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    ai: "src/ai-client.ts",
    index: "src/index.ts",
    s3: "src/s3.ts",
    image: "src/image.ts",
    instrumentation: "src/instrumentation.ts",
    server: "src/server/index.ts",
    utils: "src/utils/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: false,
  clean: true,
  external: [
    /^@qbs-autonaim\/db/,
    /^@opentelemetry\//,
    /^@langfuse\//,
    "sharp",
  ],
});
