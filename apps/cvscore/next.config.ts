import { createJiti } from "jiti";
import { NextConfig } from "next";

export default async function createNextConfig(): Promise<NextConfig> {
  const jiti = createJiti(import.meta.url);
  await jiti.import("./src/env");

  /** @type {import("next").NextConfig} */
  const config: NextConfig = {
    output: "standalone",
    serverExternalPackages: ["@qbs-autonaim/lib", "@qbs-autonaim/db"],
    experimental: {
      optimizePackageImports: ["@qbs-autonaim/ui", "lucide-react"],
      optimizeCss: true,
    },
    transpilePackages: ["@qbs-autonaim/ui"],
    compress: true,
    poweredByHeader: false,
    async headers() {
      return [
        {
          source: "/:path*",
          headers: [
            { key: "X-Frame-Options", value: "SAMEORIGIN" },
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: "Referrer-Policy", value: "origin-when-cross-origin" },
            {
              key: "Permissions-Policy",
              value: "camera=(), microphone=(), geolocation=()",
            },
          ],
        },
      ];
    },
  };

  return config;
}
