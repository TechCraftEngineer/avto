import { createJiti } from "jiti";
import { NextConfig } from "next";

export default async function createNextConfig(): Promise<NextConfig> {
  const jiti = createJiti(import.meta.url);

  // Import env files to validate at build time. Use jiti so we can load .ts files in here.
  await jiti.import("./src/env");

  /** @type {import("next").NextConfig} */
  const config: NextConfig = {
    /** Enables hot reloading for local packages without a build step */
    output: "standalone",

    transpilePackages: [
      "@qbs-autonaim/auth",
      "@qbs-autonaim/api",
      "@qbs-autonaim/db",
      "@qbs-autonaim/ui",
      "@qbs-autonaim/validators",
    ],

    /** We already do linting and typechecking as separate tasks in CI */
    typescript: { ignoreBuildErrors: true },

    /** External packages for server components */
    serverExternalPackages: ["better-auth", "ai"],

    /** Webpack configuration to handle Node.js built-ins */
    webpack: (config, { isServer }) => {
      if (isServer) {
        // Mark Node.js built-ins as external to avoid bundling issues
        config.externals = config.externals || [];
        config.externals.push({
          "node:stream/consumers": "node:stream/consumers",
          "node:stream": "node:stream",
          "node:crypto": "node:crypto",
          "node:fs": "node:fs",
          "node:path": "node:path",
        });
      }

      return config;
    },

    /** Security headers */
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
            {
              key: 'X-XSS-Protection',
              value: '1; mode=block',
            },
            {
              key: 'Referrer-Policy',
              value: 'strict-origin-when-cross-origin',
            },
            {
              key: 'Permissions-Policy',
              value: 'camera=(), microphone=(), geolocation=()',
            },
            {
              key: 'Content-Security-Policy',
              value: [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: https:",
                "font-src 'self' data:",
                "connect-src 'self' https://api.openai.com https://api.deepseek.com",
                "frame-src 'none'",
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "frame-ancestors 'none'",
              ].join('; '),
            },
          ],
        },
        {
          source: '/api/auth/(.*)',
          headers: [
            {
              key: 'X-Rate-Limit-Limit',
              value: '60',
            },
            {
              key: 'X-Rate-Limit-Remaining',
              value: '59',
            },
            {
              key: 'X-Rate-Limit-Reset',
              value: String(Math.floor(Date.now() / 1000) + 60),
            },
          ],
        },
      ];
    },
  };

  return config;
}
