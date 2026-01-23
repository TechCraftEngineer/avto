import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/index.ts",
  format: ["esm"],
  dts: {
    // Optimize DTS generation by reducing complexity
    compilerOptions: {
      skipLibCheck: true,
      skipDefaultLibCheck: true,
      // Reduce DTS generation overhead
      noEmitOnError: false,
      // Speed up compilation
      incremental: false,
      tsBuildInfoFile: undefined,
    },
  },
  outDir: "dist",
  sourcemap: false,
  clean: true,
});
