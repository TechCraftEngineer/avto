import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  clean: true,
  minify: false,
  sourcemap: false,
  // Explicit tsconfig setting for rolldown 1.0.0-beta.60+ auto-detection
  tsconfig: "tsconfig.json",
  output: {
    // Use new codeSplitting instead of deprecated advancedChunks
    codeSplitting: {
      format: "default",
    },
  },
});
