import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/index.ts",
  format: ["esm"],
  inlineOnly: false,
  dts: {
    // Optimize DTS generation by reducing complexity
    compilerOptions: {
      skipLibCheck: true,
      skipDefaultLibCheck: true,
      // Reduce DTS generation overhead
      noEmitOnError: true,
      // Speed up compilation
      incremental: false,
      tsBuildInfoFile: undefined,
    },
  },
  outDir: "dist",
  sourcemap: false,
  clean: true,
});
