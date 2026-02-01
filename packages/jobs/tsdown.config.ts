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
  external: [
    "@inngest/realtime",
    "drizzle-orm",
    "react",
    "react-dom",
    "@qbs-autonaim/config",
    "@qbs-autonaim/emails",
    "@qbs-autonaim/db",
    "@qbs-autonaim/lib",
    "@qbs-autonaim/ai",
    "@qbs-autonaim/tg-client",
  ],
});
