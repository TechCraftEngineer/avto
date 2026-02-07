import { createJiti } from "jiti";
import { NextConfig } from "next";

export default async function createNextConfig(): Promise<NextConfig> {
  const jiti = createJiti(import.meta.url);

  await jiti.import("./src/env");

  const config: NextConfig = {
    output: "standalone",

    /** Build optimizations */
    experimental: {
      optimizePackageImports: ["@qbs-autonaim/ui", "@radix-ui/react-icons", "lucide-react"],
      optimizeCss: true,
    },

    transpilePackages: [
      "@qbs-autonaim/api",
      "@qbs-autonaim/auth",
      "@qbs-autonaim/config",
      "@qbs-autonaim/db",
      "@qbs-autonaim/ui",
    ],
  };

  return config;
}
