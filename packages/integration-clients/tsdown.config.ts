import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/server.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: false,
  clean: true,
  target: "es2022",
  external: ["axios", "cheerio"],
});
