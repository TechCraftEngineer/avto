import { createJiti } from "jiti";
import { NextConfig } from "next";

export default async function createNextConfig(): Promise<NextConfig> {
  const jiti = createJiti(import.meta.url);

  await jiti.import("./src/env");

  const interviewServerUrl =
    process.env.INTERVIEW_SERVER_URL ?? "http://localhost:3002";

  const config: NextConfig = {
    output: "standalone",

    /** Proxy API to interview-server */
    rewrites: async () => [
      {
        source: "/api/:path*",
        destination: `${interviewServerUrl}/api/:path*`,
      },
    ],

    /** Exclude packages using Node.js APIs or dynamic require from bundling */
    serverExternalPackages: [
      "ai",
      "@qbs-autonaim/lib",
      "@qbs-autonaim/integration-clients",
      "@qbs-autonaim/jobs-parsers",
      "cheerio",
      "puppeteer-extra-plugin-stealth",
      "puppeteer-extra-plugin",
      "@ai-sdk/provider",
      "@ai-sdk/provider-utils",
      "@ai-sdk/gateway",
    ],

    /** Build optimizations */
    experimental: {
      optimizePackageImports: [
        "@qbs-autonaim/ui",
        "@radix-ui/react-icons",
        "lucide-react",
      ],
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
