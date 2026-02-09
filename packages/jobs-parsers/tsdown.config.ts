import { defineConfig } from "tsdown";

const isProduction = process.env.NODE_ENV === "production";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  inlineOnly: false,
  sourcemap: false,
  clean: true,
  minify: isProduction,
  tsconfig: "tsconfig.json",
  dts: {
    eager: false, // Changed to false to reduce memory usage
  },
});
