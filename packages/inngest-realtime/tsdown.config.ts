import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  dts: true,
  entry: ["src/index.ts", "src/hooks.ts", "src/middleware.ts", "src/api.ts"],
  format: ["esm"],
  outDir: "dist",
  tsconfig: "tsconfig.build.json",
  minify: false, // let bundlers handle minification if they want it
  copy: ["package.json", "LICENSE.md", "README.md", "CHANGELOG.md"],
});
