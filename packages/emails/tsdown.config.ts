import { defineConfig } from "tsdown";

const isProduction = process.env.NODE_ENV === "production";

export default defineConfig({
  entry: ["index.ts", "send.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: false,
  clean: true,
  minify: isProduction,
  target: "es2022",
  external: [
    "react",
    "react-dom",
    "@react-email/components",
    "nodemailer",
    "resend",
  ],
  treeshake: true,
});
