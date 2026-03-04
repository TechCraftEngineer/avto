import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import webExtension from "vite-plugin-web-extension";

function getManifest() {
  const manifest = JSON.parse(
    readFileSync(resolve(__dirname, "manifest.json"), "utf-8"),
  ) as Record<string, unknown>;
  const pkg = JSON.parse(
    readFileSync(resolve(__dirname, "package.json"), "utf-8"),
  ) as { version: string };
  manifest.version = pkg.version;
  return manifest;
}

export default defineConfig({
  define: {
    __API_URL__: JSON.stringify(
      process.env.EXTENSION_API_URL ?? "https://app.avtonaim.qbsoft.ru",
    ),
    __EXTENSION_API_BASE__: JSON.stringify(
      process.env.EXTENSION_API_BASE ?? "http://localhost:3002",
    ),
    __ALLOW_LOOPBACK__: (() => {
      const base = process.env.EXTENSION_API_BASE ?? "http://localhost:3002";
      try {
        const hostname = new URL(base).hostname;
        return hostname === "localhost" || hostname === "127.0.0.1";
      } catch {
        return false;
      }
    })(),
  },
  plugins: [
    react(),
    // biome-ignore lint/suspicious/noExplicitAny: vite-plugin-web-extension имеет несовместимые типы с Vite 7
    webExtension({
      manifest: getManifest,
      additionalInputs: [
        "src/callback.html",
        "src/injected/fetch-page-context.js",
        "src/injected/spoiler-chat-interceptor.js",
      ],
    }) as any,
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    minify: true,
  },
});
